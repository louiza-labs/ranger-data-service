import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const localRedirectUri = "http://localhost:8080/api/auth/google/callback";

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID ?? "488924934656-dj5h1msb2nv0p3gruf93ghmbch71sdcf.apps.googleusercontent.com",
	process.env.GOOGLE_CLIENT_SECRET ?? "GOCSPX-_087567891234567890",
	process.env.REDIRECT_URI ?? "https://hermes-data-service-muddy-cloud-3029.fly.dev/api/auth/google/callback"
);

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string);

// Generates the Google OAuth URL
export const getGoogleAuthUrl = (state: string): string => {
	return oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/userinfo.email"],
		prompt: "consent",
		state: state,
	});
};

// Exchanges code for tokens and saves them in Supabase
export const exchangeCodeForTokens = async (code: string, userId: string) => {
	try {
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);

		// Get user's email from Google
		const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
		const { data } = await oauth2.userinfo.get();
		const email = data.email;

		if (!email) {
			throw new Error("No email found in Google response");
		}

		const expiryDate = tokens.expiry_date as number;

		// Check if user already has a row in user_tokens
		const { data: existingData } = await supabase
			.from("user_tokens")
			.select("email_accounts")
			.eq("user_id", userId)
			.single();

		const newEmailAccount = {
			email,
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			expiry_date: expiryDate,
		};

		if (existingData) {
			// Update existing accounts
			const existingAccounts = existingData.email_accounts?.accounts || [];
			const accountIndex = existingAccounts.findIndex((acc: any) => acc.email === email);

			if (accountIndex >= 0) {
				existingAccounts[accountIndex] = newEmailAccount;
			} else {
				existingAccounts.push(newEmailAccount);
			}

			await supabase
				.from("user_tokens")
				.update({ email_accounts: { accounts: existingAccounts } })
				.eq("user_id", userId);
		} else {
			// Create new row
			await supabase.from("user_tokens").insert({
				user_id: userId,
				email_accounts: {
					accounts: [newEmailAccount],
				},
			});
		}

		return { tokens, email };
	} catch (error) {
		console.error("Error exchanging code for tokens:", error);
		throw new Error("Failed to exchange code for tokens");
	}
};

// Fetch tokens from Supabase
export const getTokensFromSupabase = async (userId: string) => {
	console.log("Fetching tokens for user:", userId);
	const { data, error } = await supabase.from("user_tokens").select("email_accounts").eq("user_id", userId).single();

	if (error) {
		console.error("Error retrieving tokens from Supabase:", error);
		throw new Error("Failed to retrieve tokens");
	}

	const emailAccounts = data?.email_accounts?.accounts || [];
	console.log(`Found ${emailAccounts.length} email accounts for user ${userId}`);
	return emailAccounts;
};

// Update tokens in Supabase
export const updateTokensInSupabase = async (userId: string, updatedAccounts: any[]) => {
	try {
		await supabase
			.from("user_tokens")
			.update({ email_accounts: { accounts: updatedAccounts } })
			.eq("user_id", userId);
	} catch (error) {
		console.error("Error updating tokens in Supabase:", error);
		throw new Error("Failed to update tokens");
	}
};

// Refresh tokens using Supabase data
export const refreshAccessToken = async (refreshToken: string, userId: string, email: string) => {
	try {
		oauth2Client.setCredentials({ refresh_token: refreshToken });
		const { credentials } = await oauth2Client.refreshAccessToken();

		const emailAccounts = await getTokensFromSupabase(userId);
		const updatedAccounts = emailAccounts.map((account: any) => {
			if (account.email === email) {
				return {
					...account,
					access_token: credentials.access_token,
					refresh_token: credentials.refresh_token || refreshToken,
					expiry_date: credentials.expiry_date,
				};
			}
			return account;
		});

		await updateTokensInSupabase(userId, updatedAccounts);
		return credentials;
	} catch (error) {
		console.error("Error refreshing access token:", error);
		throw new Error("Failed to refresh access token");
	}
};

// Check if the access token needs refreshing
export const isTokenExpired = (expiryDate: number): boolean => {
	if (!expiryDate) return true; // If no expiry date, assume expired
	const currentTime = Math.floor(Date.now() / 1000);
	return currentTime >= expiryDate - 300; // Refresh 5 minutes before expiration
};

// Ensure fresh tokens are available
export const ensureFreshTokens = async (userId: string) => {
	try {
		const tokens = await getTokensFromSupabase(userId);
		console.log(`Refreshing tokens for ${tokens.length} email accounts`);

		// Add debug logging to see token state
		tokens.forEach((token: any) => {
			console.log(`Token state for ${token.email}:`, {
				hasRefreshToken: !!token.refresh_token,
				expiryDate: token.expiry_date,
				isExpired: isTokenExpired(token.expiry_date),
			});
		});

		// Refresh all expired tokens
		const refreshedTokens = await Promise.all(
			tokens.map(async (tokenData: any) => {
				if (isTokenExpired(tokenData.expiry_date)) {
					console.log(`Refreshing token for email: ${tokenData.email}`);
					try {
						const newCredentials = await refreshAccessToken(tokenData.refresh_token, userId, tokenData.email);
						console.log(`Successfully refreshed token for ${tokenData.email}`);
						return {
							...tokenData,
							access_token: newCredentials.access_token,
							refresh_token: newCredentials.refresh_token || tokenData.refresh_token,
							expiry_date: newCredentials.expiry_date,
						};
					} catch (error: any) {
						console.error(`Error refreshing token for ${tokenData.email}:`, error);
						// Instead of returning the original token, we should indicate this token is invalid
						throw new Error(`Failed to refresh token for ${tokenData.email}: ${error.message}`);
					}
				}
				return tokenData;
			})
		);

		return refreshedTokens;
	} catch (error) {
		console.error("Error in ensureFreshTokens:", error);
		throw error;
	}
};
