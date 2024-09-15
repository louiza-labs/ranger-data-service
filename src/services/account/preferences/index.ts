import { createClient } from "@supabase/supabase-js";

interface taglineObject {
	tagline: string;
	hash: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export async function uploadPreference({ user_id, type, value }: any) {
	try {
		const newPreference = { user_id, type, value };
		console.log("the new preference", newPreference);
		const { data, error } = await supabase
			.from("preferences") // Replace with your table name
			.upsert(newPreference);

		if (error) {
			console.error("Error upserting connections:", error);
			return { success: false, error };
		}

		console.log("Upserted connections:", data);
		return { success: true, data };
	} catch (e) {
		return { success: false, e };
	}
}

export async function getPreferences({ user_id }: any) {
	try {
		const { data, error } = await supabase.from("preferences").select("*").eq("user_id", user_id);

		if (error) {
			console.error("Error fetching preferences:", error);
			return { success: false, error, data: [] };
		}

		if (data) {
			// Parse JSON fields back into their original object format

			return { success: true, data };
		} else {
			return { success: true, data: [] }; // No data returned
		}
	} catch (e) {
		console.error("Error fetching preferences:", e);
		return { success: false, error: e, data: [] };
	}
}

export async function deletePreferences({ user_id, type, value }: any) {
	try {
		const { data, error } = await supabase
			.from("preferences")
			.delete()
			.eq("user_id", user_id)
			.eq("type", type)
			.eq("value", value);

		if (error) {
			console.error("Error deleting preferences:", error);
			return { success: false, error, data: [] };
		}

		if (data) {
			// Parse JSON fields back into their original object format

			return { success: true, data };
		} else {
			return { success: true, data: [] }; // No data returned
		}
	} catch (e) {
		console.error("Error deleting preferences:", e);
		return { success: false, error: e, data: [] };
	}
}
