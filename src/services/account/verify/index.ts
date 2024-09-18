import { createClient } from "@supabase/supabase-js";

interface taglineObject {
	tagline: string;
	hash: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export async function verifyUsernameAndEmail({ username, email }: { username: string; email: string }) {
	try {
		const { data: userNameData, error: errorGettingUserNameDate } = await supabase
			.from("users")
			.select("*")
			.eq("user_id", username);
		const { data: emailData, error: errorGettingEmailData } = await supabase
			.from("users")
			.select("*")
			.eq("email", email);

		if (errorGettingUserNameDate || errorGettingEmailData) {
			console.error("Error fetching user:", {
				error: { username: errorGettingUserNameDate, email: errorGettingEmailData },
			});
			return { success: false, error: { username: errorGettingUserNameDate, email: errorGettingEmailData }, data: [] };
		}

		const usernameExists = userNameData && userNameData.length > 0;
		const emailExists = emailData && emailData.length > 0;

		return { success: true, data: { usernameExists, emailExists } };
	} catch (e) {
		console.error("Error fetching user:", e);
		return { success: false, error: e, data: [] };
	}
}
