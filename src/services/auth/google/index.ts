import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const localRedirectUri = "http://localhost:8080/api/auth/google/callback";

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID ?? "488924934656-dj5h1msb2nv0p3gruf93ghmbch71sdcf.apps.googleusercontent.com",
	process.env.GOOGLE_CLIENT_SECRET ?? "GOCSPX-_087567891234567890",
	process.env.REDIRECT_URI ?? localRedirectUri
	//  "https://hermes-data-service-muddy-cloud-3029.fly.dev/api/auth/google/callback"
);

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string);

// Generates the Google OAuth URL
export const getGoogleAuthUrl = (state: string): string => {
	return oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: ["https://www.googleapis.com/auth/gmail.readonly"],
		prompt: "consent",
		state: state,
	});
};

// Exchanges code for tokens and saves them in Supabase
export const exchangeCodeForTokens = async (code: string, userId: string) => {
	try {
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);

		const expiryDate = tokens.expiry_date as number;

		// Save tokens to Supabase
		await supabase.from("user_tokens").upsert({
			user_id: userId,
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			expiry_date: expiryDate,
		});

		return tokens;
	} catch (error) {
		console.error("Error exchanging code for tokens:", error);
		throw new Error("Failed to exchange code for tokens");
	}
};

// Retrieve tokens from Supabase
export const getTokensFromSupabase = async (userId: string) => {
	console.log("fetching tokens for user:", userId);
	const { data, error } = await supabase
		.from("user_tokens")
		.select("access_token, refresh_token, expiry_date")
		.eq("user_id", userId)
		.single();

	if (error || !data) {
		console.error("Error retrieving tokens from Supabase:", error);
		throw new Error("Failed to retrieve tokens");
	}

	return data;
};

// Refresh tokens using Supabase data
export const refreshAccessToken = async (refreshToken: string, userId: string) => {
	try {
		oauth2Client.setCredentials({ refresh_token: refreshToken });
		const { credentials } = await oauth2Client.refreshAccessToken();

		// Update Supabase with new tokens
		await supabase
			.from("user_tokens")
			.update({
				access_token: credentials.access_token,
				refresh_token: credentials.refresh_token || refreshToken,
				expiry_date: credentials.expiry_date,
			})
			.eq("user_id", userId);

		return credentials;
	} catch (error) {
		console.error("Error refreshing access token:", error);
		throw new Error("Failed to refresh access token");
	}
};

// Check if the access token needs refreshing
export const isTokenExpired = (expiryDate: number): boolean => {
	const currentTime = Math.floor(Date.now() / 1000);
	return currentTime >= expiryDate - 300; // Refresh 5 minutes before expiration
};

// Ensure fresh tokens are available
export const ensureFreshTokens = async (userId: string) => {
	const tokens = await getTokensFromSupabase(userId);

	if (!tokens || !tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
		throw new Error("Invalid token data");
	}

	if (isTokenExpired(tokens.expiry_date)) {
		const newCredentials = await refreshAccessToken(tokens.refresh_token, userId);
		return {
			access_token: newCredentials.access_token,
			refresh_token: newCredentials.refresh_token || tokens.refresh_token,
			expiry_date: newCredentials.expiry_date,
		};
	}

	return tokens;
};
