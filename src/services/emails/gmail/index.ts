import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { SUBJECT_KEYWORDS, TRACKING_KEYWORDS } from "../../../lib/constants";
import {
	determineEmailContext,
	extractEmail,
	filterHeaders,
	getDummyJobRole,
	getMessageBody,
	isJobApplicationRelated,
	parseDate,
	sanitizeAndTruncate,
} from "../../../lib/emails";
import { determineCompanyName, determineEmailType, determineRecruitmentStatus } from "../../ai";
import { Application, createApplication } from "../../applications";
import { ensureFreshTokens } from "../../auth/google";

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.REDIRECT_URI
);

const USE_DUMMY_AI = true;
// Add new function to check tracking relevance
function isTrackingRelevant(subject: string, body: string, status: string): boolean {
	const lowerSubject = subject.toLowerCase();
	const lowerBody = body.toLowerCase();

	// Check for tracking keywords
	const hasTrackingKeyword = TRACKING_KEYWORDS.some(
		(keyword) => lowerSubject.includes(keyword.toLowerCase()) || lowerBody.includes(keyword.toLowerCase())
	);

	// Check for status changes
	const hasStatusIndicator = [
		"rejected",
		"accepted",
		"interviewed",
		"scheduled",
		"pending",
		"reviewing",
		"offered",
	].some((statusWord) => status.toLowerCase().includes(statusWord));

	// Check for common tracking patterns
	const hasTrackingPatterns = [
		/next.*steps/i,
		/status.*update/i,
		/application.*process/i,
		/interview.*(?:schedule|feedback|result)/i,
		/decision.*made/i,
	].some((pattern) => pattern.test(subject) || pattern.test(body));

	return hasTrackingKeyword || hasStatusIndicator || hasTrackingPatterns;
}

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

// Simplify emailCache implementation
const emailCache = new Map<string, string>();

const getFromCache = (key: string) => {
	return emailCache.get(key);
};

const setInCache = (key: string, value: string) => {
	emailCache.set(key, value);
};

// Simplify getGmailEmails function
export const getGmailEmails = async (
	userId: string,
	options = { pageSize: 50, pageToken: undefined as string | undefined }
) => {
	try {
		// Add early DB check for existing emails
		const { data: existingEmails } = await supabase.from("processed_emails").select("id").eq("user_id", userId);

		const existingEmailIds = new Set(existingEmails?.map((email) => email.id) || []);

		const tokens = await ensureFreshTokens(userId);
		oauth2Client.setCredentials(tokens);
		const gmail = google.gmail({ version: "v1", auth: oauth2Client });

		const response = await gmail.users.messages.list({
			userId: "me",
			q: `{${SUBJECT_KEYWORDS.join(" OR ")}} in:anywhere`,
			maxResults: options.pageSize,
			pageToken: options.pageToken || undefined,
		});

		const messageIds = response.data.messages || [];

		// Filter out already processed emails before fetching details
		const newMessageIds = messageIds.filter((msg) => {
			// Convert hex ID to decimal for comparison
			const hexId = msg.id.replace(/[^0-9a-fA-F]/g, "");
			const decimalId = BigInt(`0x${hexId}`).toString();
			const normalizedId = BigInt(decimalId) > BigInt("9223372036854775807") ? decimalId.slice(-18) : decimalId;
			return !existingEmailIds.has(normalizedId);
		});

		console.log(`Filtered out ${messageIds.length - newMessageIds.length} already processed emails`);

		const messages = await Promise.all(
			newMessageIds.map(async (msg) => {
				const message = await gmail.users.messages.get({ userId: "me", id: msg.id });
				return message;
			})
		);

		const processedEmails = await Promise.all(
			messages.map(async (message) => {
				const headers = filterHeaders(message.data.payload?.headers);
				const subject = headers.find((h) => h.name === "Subject")?.value || "";
				const from = headers.find((h) => h.name === "From")?.value || "";
				const to = headers.find((h) => h.name === "To")?.value || "";
				const date = headers.find((h) => h.name === "Date")?.value || "";
				const body = getMessageBody(message.data);
				const status = USE_DUMMY_AI ? (await determineRecruitmentStatus(body, false)).status || "Unknown" : "Unknown";

				// Ensure status is always a string before using charAt
				const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

				// Modified filtering logic
				const isJobRelated = isJobApplicationRelated(subject, body, from);
				const isTracking = isTrackingRelevant(subject, body, formattedStatus);

				// Keep the emaidl if EITHER condition is true
				if (isJobRelated || isTracking) {
					const company = await determineCompanyName(subject, body, from, to);
					if (!company) {
						console.log(`Skipping email - missing company name: ${message.data.id}`);
						return null;
					}

					return {
						id: message.data.id,
						threadId: message.data.threadId,
						snippet: sanitizeAndTruncate(message.data.snippet || "", 255),
						headers,
						body: sanitizeAndTruncate(body, 65535),
						subject: sanitizeAndTruncate(subject, 255),
						senderEmail: extractEmail(from),
						receiverEmail: extractEmail(to),
						date: parseDate(date),
						company: company.companyName,
						position: (await getDummyJobRole(body + " " + subject)).jobRole,
						status: formattedStatus,
						context: determineEmailContext(subject, body),
					};
				}

				console.log(`Filtering out email - Not job related (${isJobRelated}) or tracking relevant (${isTracking})`);
				return null;
			})
		);

		await processAndStoreEmails(
			userId,
			processedEmails.filter((email) => email !== null)
		);

		return {
			emails: processedEmails,
			nextPageToken: response.data.nextPageToken,
			hasMore: !!response.data.nextPageToken,
		};
	} catch (error) {
		console.error("Error in getGmailEmails:", error);
		throw error;
	}
};

// Add new context type for irrelevant emails
const EMAIL_CONTEXTS = {
	JOB: "job",
	INTERVIEW: "interview",
	IRRELEVANT: "irrelevant",
} as const;

// Modify the processAndStoreEmails function
async function processAndStoreEmails(userId: string, emails: any[]) {
	const { data: existingApplications, error: fetchError } = await supabase
		.from("applications")
		.select("id, context, company, position")
		.eq("user_id", userId);

	if (fetchError) {
		console.error("Error fetching existing applications:", fetchError);
		throw new Error("Failed to fetch existing applications");
	}

	// Debug log to see what we're getting from the database
	console.log("Existing applications:", JSON.stringify(existingApplications, null, 2));

	// Process emails in batches to avoid rate limiting
	for (const email of emails) {
		try {
			// Convert email ID for database storage first
			const emailIdForDb = convertEmailIdToDecimal(email.id);

			// Check if we've already processed this email
			const { data: existingEmail } = await supabase
				.from("processed_emails")
				.select("context")
				.eq("id", emailIdForDb)
				.single();

			if (existingEmail) {
				console.log(`Email ${email.id} already processed with context: ${existingEmail.context}`);
				continue;
			}

			// Determine if email is recruitment related
			const emailTypeResult = await determineEmailType(
				email.subject,
				email.body,
				email.senderEmail,
				email.receiverEmail
			);

			// If not recruitment related, store as irrelevant and skip
			if (!emailTypeResult.isRecruitmentEmail) {
				await supabase.from("processed_emails").insert({
					id: emailIdForDb,
					user_id: userId,
					context: EMAIL_CONTEXTS.IRRELEVANT,
					created_at: new Date().toISOString(),
					email_subject: email.subject,
					email_body: email.body,
					email_sender_email: email.senderEmail,
					email_receiver_email: email.receiverEmail,
					date: email.date,
					company: null, // No company needed for irrelevant emails
				});

				console.log(`Marked email ${email.id} as irrelevant`);
				continue;
			}

			// Process relevant email
			const company = await determineCompanyName(email.subject, email.body, email.senderEmail, email.receiverEmail);
			if (!company) {
				console.log(`Skipping email - missing company name: ${email.id}`);
				continue;
			}

			// Map email type to context
			const context = emailTypeResult.emailType.includes("interview") ? EMAIL_CONTEXTS.INTERVIEW : EMAIL_CONTEXTS.JOB;

			// Modify the application finding logic to be more defensive
			let applicationId = existingApplications.find((app) => {
				// Debug log for the comparison
				console.log("Comparing:", {
					appCompany: app?.company,
					newCompany: company?.companyName,
					appPosition: app?.position,
					newPosition: email?.position,
					context,
				});

				// More defensive comparison
				const appCompanyName =
					typeof app?.company === "string" ? app.company.toLowerCase() : app?.company?.companyName?.toLowerCase();
				const newCompanyName = company?.companyName?.toLowerCase();

				return (
					appCompanyName === newCompanyName &&
					app.context === context &&
					(context !== EMAIL_CONTEXTS.JOB || app.position === email.position)
				);
			})?.id;

			if (!applicationId) {
				const { data, error } = await createApplication(
					userId,
					context,
					company.companyName,
					email.position,
					email.status,
					email.senderEmail,
					email.receiverEmail
				);

				if (error) {
					console.error("Error creating new application:", error);
					continue;
				}

				applicationId = data.id;
			}

			// Store the processed email
			await supabase.from("processed_emails").insert({
				id: emailIdForDb,
				user_id: userId,
				application_id: applicationId,
				context: context,
				created_at: new Date().toISOString(),
				email_subject: email.subject,
				email_body: email.body,
				email_sender_email: email.senderEmail,
				email_receiver_email: email.receiverEmail,
				date: email.date,
				company: company,
			});
		} catch (error) {
			console.error(`Error processing email ${email.id}:`, error);
			continue;
		}
	}
}

// Helper function to convert email ID
function convertEmailIdToDecimal(emailId: string): string {
	try {
		const hexId = emailId.replace(/[^0-9a-fA-F]/g, "");
		const decimalId = BigInt(`0x${hexId}`).toString();
		return BigInt(decimalId) > BigInt("9223372036854775807") ? decimalId.slice(-18) : decimalId;
	} catch (error) {
		console.error(`Error converting email ID ${emailId} to decimal:`, error);
		throw error;
	}
}

// Simplify processAIRequests function
async function processAIRequests(emails: any[]) {
	const results = new Map();

	for (const email of emails) {
		const cacheKey = `${email.data.id}`;
		let status = getFromCache(cacheKey);

		if (!status) {
			const statusResult = await determineRecruitmentStatus(email.body, false);
			status = statusResult.status;
			setInCache(cacheKey, status);
		}

		results.set(cacheKey, { status });
	}

	return results;
}

async function getEmailThreadForApplication(application: Application, gmail: any): Promise<any[]> {
	try {
		// Search for emails matching the application's company and context
		const response = await gmail.users.messages.list({
			userId: "me",
			q: `from:(${application.sender_email}) OR to:(${application.receiver_email}) subject:(${application.company})`,
		});

		const messageIds = response.data.messages || [];
		const messages = await Promise.all(
			messageIds.map(async (msg: any) => {
				const message = await gmail.users.messages.get({ userId: "me", id: msg.id });
				return message;
			})
		);

		// Process the messages similar to existing email processing
		const processedEmails = await Promise.all(
			messages.map(async (message) => {
				const headers = filterHeaders(message.data.payload?.headers);
				const subject = headers.find((h) => h.name === "Subject")?.value || "";
				const from = headers.find((h) => h.name === "From")?.value || "";
				const to = headers.find((h) => h.name === "To")?.value || "";
				const date = headers.find((h) => h.name === "Date")?.value || "";
				const body = getMessageBody(message.data);

				return {
					id: message.data.id,
					threadId: message.data.threadId,
					snippet: sanitizeAndTruncate(message.data.snippet || "", 255),
					headers,
					body: sanitizeAndTruncate(body, 65535),
					subject: sanitizeAndTruncate(subject, 255),
					senderEmail: extractEmail(from),
					receiverEmail: extractEmail(to),
					date: parseDate(date),
					company: application.company,
					position: application.position,
					status: application.status,
					context: application.context,
				};
			})
		);

		return processedEmails;
	} catch (error) {
		console.error("Error fetching email thread:", error);
		return [];
	}
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

export const getAllGmailEmails = async (userId: string, options = { batchSize: 50 }) => {
	try {
		let allEmails: any[] = [];
		let pageToken: string | undefined = undefined;
		let totalProcessed = 0;
		let retries = 0;

		do {
			try {
				const result = await getGmailEmails(userId, {
					pageSize: options.batchSize,
					pageToken: pageToken,
				});

				if (result.emails) {
					allEmails = [...allEmails, ...result.emails];
					totalProcessed += result.emails.length;
					console.log(`Processed ${totalProcessed} emails so far...`);
				}

				pageToken = result.nextPageToken;
				retries = 0; // Reset retries on successful request

				// Add longer delay between successful batches
				if (pageToken) {
					await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds
				}
			} catch (error: any) {
				console.error(`Error processing batch: ${error.message}`);

				if (retries >= MAX_RETRIES) {
					console.error("Max retries reached, stopping process");
					break;
				}

				retries++;
				const backoffTime = INITIAL_BACKOFF * Math.pow(2, retries - 1);
				console.log(`Retrying in ${backoffTime}ms... (Attempt ${retries}/${MAX_RETRIES})`);
				await new Promise((resolve) => setTimeout(resolve, backoffTime));

				// Continue with the same pageToken on retry
				continue;
			}
		} while (pageToken);

		console.log(`Completed processing all emails. Total: ${totalProcessed}`);
		return {
			emails: allEmails,
			total: totalProcessed,
			isComplete: !pageToken, // Indicates if we completed all pages
		};
	} catch (error) {
		console.error("Fatal error in getAllGmailEmails:", error);
		throw error;
	}
};
