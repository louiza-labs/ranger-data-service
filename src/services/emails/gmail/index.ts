import { google } from "googleapis";
import { ensureFreshTokens } from "../../auth/google";

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.REDIRECT_URI
);

const SUBJECT_KEYWORDS = [
	// Application stage
	"applied",
	"application",
	"your application",
	"job application",
	"position application",
	"resume received",
	"application received",
	"application submitted",

	// Interest and initial contact
	"your interest",
	"interest in",
	"regarding your interest",
	"thank you for your interest",
	"exploring opportunities",
	"career opportunities",

	// Screening and initial assessment
	"initial screening",
	"phone screening",
	"preliminary assessment",
	"skills assessment",
	"coding challenge",
	"technical assessment",
	"take-home assignment",

	// Interview process
	"interview",
	"interview invitation",
	"schedule an interview",
	"interview confirmation",
	"phone interview",
	"video interview",
	"on-site interview",
	"final round",
	"meet the team",
	"interview feedback",

	// Follow-up and status updates
	"application status",
	"status update",
	"next steps",
	"follow-up",

	// Offer stage
	"job offer",
	"offer letter",
	"employment offer",
	"congratulations",

	// Rejection and closure
	"application status update",
	"thank you for applying",
	"position filled",
	"not moving forward",
	"other candidates",
	"future opportunities",
];

const RELEVANT_HEADERS = ["Subject", "From", "To", "Date"];

export const getGmailEmails = async (userId: string, maxEmails: number = 200) => {
	try {
		const tokens = await ensureFreshTokens(userId);
		oauth2Client.setCredentials(tokens);

		const gmail = google.gmail({ version: "v1", auth: oauth2Client });
		const query = SUBJECT_KEYWORDS.map((keyword) => `subject:"${keyword}"`).join(" OR ");

		let allMessages: any[] = [];
		let nextPageToken: string | undefined;

		do {
			const response = await gmail.users.messages.list({
				userId: "me",
				q: query,
				maxResults: Math.min(maxEmails - allMessages.length, 100), // Gmail API limit is 100 per request
				pageToken: nextPageToken,
			});

			const messageIds = response.data.messages?.map((message: any) => message.id!) || [];
			const messages = await Promise.all(
				messageIds.map((id: string) =>
					gmail.users.messages.get({
						userId: "me",
						id,
						format: "full",
					})
				)
			);

			allMessages = allMessages.concat(messages);
			nextPageToken = response.data.nextPageToken;
		} while (nextPageToken && allMessages.length < maxEmails);

		return allMessages.map((message) => ({
			id: message.data.id,
			threadId: message.data.threadId,
			snippet: message.data.snippet,
			headers: filterHeaders(message.data.payload?.headers),
			body: getMessageBody(message.data),
		}));
	} catch (error) {
		console.error("Error fetching emails:", error);
		throw new Error("Failed to fetch emails");
	}
};

function filterHeaders(headers: any[] | undefined): any[] {
	if (!headers) return [];
	return headers.filter((header) => RELEVANT_HEADERS.includes(header.name));
}

function getMessageBody(message: any): string {
	if (message.payload.body.data) {
		return Buffer.from(message.payload.body.data, "base64").toString("utf-8");
	}

	if (message.payload.parts) {
		for (let part of message.payload.parts) {
			if (part.mimeType === "text/plain" && part.body.data) {
				return Buffer.from(part.body.data, "base64").toString("utf-8");
			}
		}
	}

	return "No readable message body found";
}
