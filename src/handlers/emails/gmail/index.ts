import { Context } from "hono";
import { determineRecruitmentStatus } from "../../../services/ai";
import { ensureFreshTokens } from "../../../services/auth/google";
import { getGmailEmails } from "../../../services/emails/gmail";

export const refreshTokenMiddleware = async (c: Context, next: () => Promise<void>) => {
	try {
		const { user_id } = c.req.query();
		await ensureFreshTokens(user_id);
		await next();
	} catch (error) {
		return c.json({ error: "Failed to refresh token" }, 401);
	}
};

export const handleGetEmails = async (c: Context) => {
	try {
		const userId = c.req.query("user_id");
		if (!userId) {
			return c.json({ error: "User ID is required" }, 400);
		}

		// Verify that the requested userId matches the one in the JWT
		// TODO: Implement JWT verification

		await ensureFreshTokens(userId);
		const allEmails = await getGmailEmails(userId);
		console.log("All emails count:", allEmails.length);
		const jobApplicationEmails = await filterJobApplicationEmails(allEmails);
		console.log("Job application emails count:", jobApplicationEmails.length);
		const organizedEmails = await addJobStatusToEmails(jobApplicationEmails);
		console.log("Organized emails count:", organizedEmails.length);
		return c.json(organizedEmails);
	} catch (error) {
		console.error("Error processing emails:", error);
		return c.json({ error: "Failed to process emails" }, 500);
	}
};

async function filterJobApplicationEmails(emails: any[]): Promise<any[]> {
	const filteredEmails = [];
	console.log("the emailz", emails);

	for (const email of emails) {
		if (!email.headers) continue;
		("");
		const subject = email.headers.find((header: any) => header.name === "Subject");
		if (!subject) continue;
		const subjectText = subject.value;

		if (isJobRelatedSubject(subjectText)) {
			filteredEmails.push(email);
			// const { emailType, confidence } = await determineEmailType(subjectText, true);
			// if (emailType !== "other" && confidence > 0.7) {
			// 	filteredEmails.push(email);
			// }
		}
	}
	return filteredEmails;
}

async function addJobStatusToEmails(emails: any[]): Promise<any[]> {
	return Promise.all(
		emails.map(async (email) => {
			const subject = email.headers.find((header: any) => header.name === "Subject").value;
			const body = email.body || "";
			const { status, confidence }: any = await determineRecruitmentStatus(subject + "\n" + body, false);
			return {
				...email,
				jobStatus: confidence > 0.7 ? status : "unknown",
			};
		})
	);
}

function isJobRelatedSubject(subject: string): boolean {
	const jobRelatedKeywords = [
		// Application
		"job application",
		"apply",
		"applied",
		"application to",
		"applying to",
		"application submitted",
		"your interest in",
		// Offer
		"job offer",
		"offer letter",
		"employment offer",
		// Interview
		"interview",
		"phone screen",
		"coding challenge",
		"technical assessment",
		// Rejection
		"application status",
		"thank you for your interest",
		"position filled",
		// General
		"job opportunity",
		"career",
		"position",
		"employment",
		"hiring",
		"recruiter",
		"talent acquisition",
		"human resources",
	];

	const lowercaseSubject = subject.toLowerCase();
	return jobRelatedKeywords.some((keyword) => lowercaseSubject.includes(keyword));
}
