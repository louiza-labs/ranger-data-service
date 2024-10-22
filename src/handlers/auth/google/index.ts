import { Context } from "hono";
import { ensureFreshTokens, exchangeCodeForTokens, getGoogleAuthUrl } from "../../../services/auth/google";

// Initiates Google OAuth
export const initiateGoogleAuth = async (c: Context) => {
	try {
		const userId = c.req.query("user_id");
		if (!userId) {
			return c.json({ error: "User ID is required" }, 400);
		}

		const state = encodeURIComponent(JSON.stringify({ userId }));
		const authUrl = getGoogleAuthUrl(state);
		console.log("Generated auth URL:", authUrl);
		return c.redirect(authUrl);
	} catch (error) {
		console.error("Failed to generate auth URL:", error);
		return c.json({ error: "Failed to initiate Google Auth" }, 500);
	}
};

// Handles the OAuth callback
export const handleGoogleCallback = async (c: Context) => {
	const code = c.req.query("code");
	const state = c.req.query("state");

	console.log("Received code:", code);
	console.log("Received state:", state);

	if (!code) {
		console.log("Authorization code is missing");
		return c.json({ error: "Authorization code is missing" }, 400);
	}

	if (!state) {
		console.log("State is missing");
		return c.json({ error: "State is missing" }, 400);
	}

	try {
		const { userId } = JSON.parse(decodeURIComponent(state));
		if (!userId) {
			return c.json({ error: "Invalid state" }, 400);
		}

		const tokens = await exchangeCodeForTokens(code, userId);
		console.log("Tokens received:", tokens);
		return c.redirect(`http://localhost:3000/?success=true&tokens=${JSON.stringify(tokens)}`);
	} catch (error) {
		console.error("OAuth callback failed:", error);
		return c.json({ error: "OAuth callback failed", details: error }, 500);
	}
};

export const refreshTokenMiddleware = async (c: Context, next: () => Promise<void>) => {
	try {
		const { user_id } = c.req.query();
		await ensureFreshTokens(user_id);
		await next();
	} catch (error) {
		return c.json({ error: "Failed to refresh token" }, 401);
	}
};
