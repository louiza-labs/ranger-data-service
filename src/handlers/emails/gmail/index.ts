import { Context } from "hono";
import { ensureFreshTokens } from "../../../services/auth/google";
import { getAllGmailEmails, getGmailEmails } from "../../../services/emails/gmail";

const TIMEOUT = 30000; // 30 seconds timeout

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
		const pageToken = c.req.query("pageToken");
		const pageSize = parseInt(c.req.query("pageSize") || "20");

		if (!userId) {
			return c.json({ error: "User ID is required" }, 400);
		}

		// Create an AbortController for timeout management
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, TIMEOUT);

		try {
			const emailsResult = await getGmailEmails(userId, {
				pageSize,
				pageToken,
			});

			clearTimeout(timeoutId);

			return c.json({
				emails: Array.isArray(emailsResult.emails) ? emailsResult.emails : [],
				pagination: {
					nextPageToken: emailsResult.nextPageToken,
					hasMore: emailsResult.hasMore,
				},
			});
		} catch (error) {
			clearTimeout(timeoutId);
			if (error.name === "AbortError") {
				return c.json({ error: "Request timed out" }, 504);
			}
			throw error;
		}
	} catch (error) {
		console.error("Error in handleGetEmails:", error);
		return c.json(
			{
				error: "Failed to process request",
				details: error.message,
			},
			500
		);
	}
};

export const handleGetAllEmails = async (c: Context) => {
	try {
		const userId = c.req.query("user_id");
		if (!userId) {
			return c.json({ error: "User ID is required" }, 400);
		}

		const result = await getAllGmailEmails(userId);
		return c.json(result);
	} catch (error) {
		console.error("Error in handleGetAllEmails:", error);
		return c.json({ error: "Failed to process request" }, 500);
	}
};
