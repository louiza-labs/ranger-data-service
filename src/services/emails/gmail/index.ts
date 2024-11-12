import { google } from "googleapis";
import { SUBJECT_KEYWORDS } from "../../../lib/constants";
import { extractEmail, filterHeaders, getMessageBody, parseDate, sanitizeAndTruncate } from "../../../lib/emails";
import { determineEmailTypeWithoutAI } from "../../../lib/emails/helpers";
import { ensureFreshTokens, getTokensFromSupabase } from "../../auth/google";
import { BatchResult, GetAllEmailsOptions } from "../types";
import { createBatchResult, handleRetry } from "../utils/batchUtils";

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.REDIRECT_URI
);

// Initialize Supabase client

// Add flag at the top with other constants
const PROCESS_ALL_ACCOUNTS = false; // Toggle this to control single/multi account processing

// Simplify getGmailEmails function
export const getGmailEmails = async (
	userId: string,
	options = { pageSize: 50, pageToken: undefined as string | undefined, specificEmail: undefined as string | undefined }
) => {
	try {
		console.log("Getting Gmail emails for user:", userId);
		const tokens = await getTokensFromSupabase(userId);
		console.log(`Found ${tokens.length} email accounts to process`);

		const tokensToProcess = options.specificEmail
			? tokens.filter((t: any) => t.email === options.specificEmail)
			: tokens;

		console.log(`Processing ${tokensToProcess.length} email account(s)`);

		const allEmailResults = await Promise.all(
			tokensToProcess.map(async (tokenData: any) => {
				console.log(`Processing emails for account: ${tokenData.email}`);
				try {
					const oauth2ClientForAccount = new google.auth.OAuth2(
						process.env.GOOGLE_CLIENT_ID,
						process.env.GOOGLE_CLIENT_SECRET,
						process.env.REDIRECT_URI
					);

					const freshTokens = await ensureFreshTokens(userId);
					const currentToken = freshTokens.find((t) => t.email === tokenData.email);

					if (!currentToken) {
						console.error(`No token found for email: ${tokenData.email}`);
						return { emails: [], nextPageToken: null, hasMore: false, email: tokenData.email };
					}

					oauth2ClientForAccount.setCredentials({
						access_token: currentToken.access_token,
						refresh_token: currentToken.refresh_token,
					});

					const gmail = google.gmail({ version: "v1", auth: oauth2ClientForAccount });

					const response = await gmail.users.messages.list({
						userId: "me",
						q: `{${SUBJECT_KEYWORDS.join(" OR ")}} in:anywhere`,
						maxResults: options.pageSize,
						pageToken: options.pageToken || undefined,
					});

					const messages = await Promise.all(
						(response.data.messages || []).map(async (msg: any) => {
							const message = await gmail.users.messages.get({ userId: "me", id: msg.id });
							return message;
						})
					);

					// Process and filter emails
					const processedEmails = [];
					for (const message of messages) {
						const headers = filterHeaders(message.data.payload?.headers);
						const subject = headers.find((h) => h.name === "Subject")?.value || "";
						const from = headers.find((h) => h.name === "From")?.value || "";
						const to = headers.find((h) => h.name === "To")?.value || "";
						const date = headers.find((h) => h.name === "Date")?.value || "";
						const body = getMessageBody(message.data);
						const senderEmail = extractEmail(from);
						const receiverEmail = extractEmail(to);

						if (senderEmail === tokenData.email) {
							continue;
						}
						// Check if email is recruitment-related
						const emailTypeResult = determineEmailTypeWithoutAI(subject, body, senderEmail || "", receiverEmail || "");

						// Only include recruitment-related emails
						if (emailTypeResult.isRecruitmentEmail) {
							processedEmails.push({
								id: message.data.id,
								threadId: message.data.threadId,
								snippet: sanitizeAndTruncate(message.data.snippet || "", 255),
								headers,
								body: sanitizeAndTruncate(body, 65535),
								subject: sanitizeAndTruncate(subject, 255),
								senderEmail,
								receiverEmail,
								date: parseDate(date),
								emailType: emailTypeResult.emailType,
								confidence: emailTypeResult.confidence,
							});
						}
					}

					console.log(`Found ${processedEmails.length} recruitment-related emails out of ${messages.length} total`);

					return {
						emails: processedEmails,
						nextPageToken: response.data.nextPageToken,
						hasMore: !!response.data.nextPageToken,
						email: tokenData.email,
					};
				} catch (error) {
					console.error(`Error processing emails for ${tokenData.email}:`, error);
					return { emails: [], nextPageToken: null, hasMore: false, email: tokenData.email };
				}
			})
		);

		// Log results
		allEmailResults.forEach((result) => {
			console.log(`Found ${result.emails.length} recruitment emails for ${result.email}`);
		});

		// Combine results from all accounts
		const combinedEmails = allEmailResults.flatMap((result) => result.emails);
		const hasMorePages = allEmailResults.some((result) => result.hasMore);

		return {
			emails: combinedEmails,
			nextPageToken: hasMorePages
				? JSON.stringify(
						allEmailResults.map((r) => ({
							email: r.email,
							token: r.nextPageToken,
						}))
				  )
				: undefined,
			hasMore: hasMorePages,
		};
	} catch (error) {
		console.error("Error in getGmailEmails:", error);
		throw error;
	}
};

export const getAllGmailEmails = async (
	userId: string,
	options: GetAllEmailsOptions = {
		batchSize: 50,
		maxEmails: 5000,
		maxPages: 20,
		specificEmail: undefined as string | undefined,
	},
	onBatchProcessed?: (result: BatchResult) => Promise<void>
) => {
	try {
		let totalProcessed = 0;
		let totalErrors = 0;
		let pageCount = 0;
		let retries = 0;
		let pageTokens: Map<string, string | undefined> = new Map();
		let hasMoreEmails = true; // Track if any account has more emails

		const tokens = await getTokensFromSupabase(userId);
		console.log(`Found ${tokens.length} email accounts to process`);

		do {
			hasMoreEmails = false; // Reset at the start of each cycle
			try {
				for (const tokenData of tokens) {
					// Skip this email account if it has no more pages
					if (pageTokens.get(tokenData.email) === undefined && pageCount > 0) {
						continue;
					}

					// Check limits
					if (totalProcessed >= (options.maxEmails || Infinity)) {
						return createBatchResult("MAX_EMAILS_REACHED", totalProcessed, totalErrors);
					}

					if (pageCount >= (options.maxPages || Infinity)) {
						return createBatchResult("MAX_PAGES_REACHED", totalProcessed, totalErrors);
					}

					const batchResult = await processSingleBatch(userId, tokenData, pageTokens, options, totalProcessed);

					// Update pageToken for this email account
					if (batchResult.nextPageToken) {
						pageTokens.set(tokenData.email, batchResult.nextPageToken);
						hasMoreEmails = true; // This account has more emails
					} else {
						pageTokens.set(tokenData.email, undefined);
					}

					totalProcessed += batchResult.processedCount;
					totalErrors += batchResult.errorCount;

					if (onBatchProcessed) {
						await onBatchProcessed(batchResult);
					}
				}

				pageCount++;
				retries = 0;
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				if (!handleRetry(error, retries)) {
					return createBatchResult("MAX_RETRIES_REACHED", totalProcessed, totalErrors);
				}
				retries++;
			}
		} while (
			hasMoreEmails && // Changed condition to use our new flag
			totalProcessed < (options.maxEmails || Infinity) &&
			pageCount < (options.maxPages || Infinity)
		);

		return createBatchResult("COMPLETE", totalProcessed, totalErrors);
	} catch (error) {
		console.error("Fatal error in getAllGmailEmails:", error);
		throw error;
	}
};

async function processSingleBatch(
	userId: string,
	tokenData: any,
	pageTokens: Map<string, string | undefined>,
	options: GetAllEmailsOptions,
	totalProcessed: number
): Promise<BatchResult> {
	const email = tokenData.email;
	let pageToken = pageTokens.get(email);

	// Parse the pageToken if it's a stringified JSON
	if (Array.isArray(pageToken)) {
		pageToken = pageToken.find((t: any) => t.email === email)?.token;
	} else if (typeof pageToken === "string" && pageToken.startsWith("[")) {
		try {
			const parsedToken = JSON.parse(pageToken);
			const emailToken = parsedToken.find((t: any) => t.email === email);
			pageToken = emailToken?.token;
		} catch (e) {
			console.error("Error parsing pageToken:", e);
			pageToken = undefined;
		}
	}

	console.log(`Fetching emails for ${email} with pageToken: ${pageToken}`);

	const result = await getGmailEmails(userId, {
		pageSize: options.batchSize,
		pageToken: pageToken,
		specificEmail: email,
	});

	const remainingCapacity = (options.maxEmails || Infinity) - totalProcessed;
	const emailsToProcess = result.emails.slice(0, remainingCapacity);

	return {
		emails: emailsToProcess,
		nextPageToken: result.nextPageToken,
		isComplete: !result.nextPageToken,
		processedCount: emailsToProcess.length,
		errorCount: 0,
	};
}
