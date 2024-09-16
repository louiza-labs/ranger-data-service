import { createClient } from "@supabase/supabase-js";
import linkedIn from "linkedin-jobs-api";

interface taglineObject {
	tagline: string;
	hash: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

export async function getJobsFromLinkedin({}: any) {
	try {
		const queryOptions = {
			keyword: "software engineer",
			location: "New York",
			dateSincePosted: "past Week",
			jobType: "full time",
			// remoteFilter: "remote",
			// salary: "100000",
			// experienceLevel: "entry level",
			limit: "10",
			page: "1",
		};

		const res = linkedIn.query(queryOptions).then((response: any) => {
			return response;
		});
		return res;
	} catch (e) {
		console.error("Error fetching jobs:", e);
		return { success: false, error: e, data: [] };
	}
}
