import { createClient } from "@supabase/supabase-js";

interface taglineObject {
	tagline: string;
	hash: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export async function uploadConnections({ connections, user_id }: { connections: any[]; user_id: string }) {
	try {
		console.log("the user id", user_id);

		const formattedConnections = connections.map((connection) => {
			return {
				...connection,
				user_id_username_identifier: `${user_id}-${connection.UserName}`,
			};
		});
		const { data, error } = await supabase
			.from("linkedin-connections") // Replace with your table name
			.upsert(formattedConnections, {
				onConflict: "user_id_username_identifier",
			});

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

export async function getLinkedinConnectionsFromDB({ user_id }: { user_id: string }) {
	try {
		const { data, error } = await supabase
			.from("linkedin-connections")
			.select("*")
			.eq("user_id_for_connection", user_id);

		if (error) {
			console.error("Error fetching linkedIn connections:", error);
			return { success: false, error, data: [] };
		}

		if (data) {
			// Parse JSON fields back into their original object format

			return { success: true, data };
		} else {
			return { success: true, data: [] }; // No data returned
		}
	} catch (e) {
		console.error("Error fetching linkedin connections:", e);
		return { success: false, error: e, data: [] };
	}
}
