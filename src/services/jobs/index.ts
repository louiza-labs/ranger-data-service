import { createClient } from "@supabase/supabase-js";
import linkedIn from "linkedin-jobs-api";

interface taglineObject {
	tagline: string;
	hash: string;
}

interface JobListing {
	position: string;
	company: string;
	companyLogo: string;
	location: string;
	date: string;
	agoTime: string;
	salary: string;
	jobUrl: string;
	job_id: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

interface jobsFromLinkedinArgs {
	page?: number;
	keyword?: string;
	location?: string;
	dateSincePosted?: "past month" | "past week" | "24hr";
	limit?: string;
}
export async function getJobsFromLinkedin({
	page = 0,
	keyword = "software engineer",
	location = "New York, NY",
	dateSincePosted = "past week",
	limit = "10",
}: jobsFromLinkedinArgs) {
	try {
		const queryOptions = {
			keyword: String(keyword),
			location: String(location),
			dateSincePosted: String(dateSincePosted),
			jobType: "full time",
			// remoteFilter: "remote",
			// salary: "100000",
			// experienceLevel: "entry level",
			limit: String(limit) ?? "10",
			page: String(page),
		};
		const res = await linkedIn.query(queryOptions);

		return { data: res, count: res && res.length ? res.length : 0 };
	} catch (e) {
		console.error("Error fetching jobs:", e);
		return { success: false, error: e, data: [], count: 0 };
	}
}

export async function getJobsFromLinkedinFromDB() {
	try {
		const { data, error } = await supabase
			.from("linkedin-jobs") // Replace with your table name
			.select("*");

		if (error) {
			console.error("Error getting jobs:", error);
			return { success: false, error, data: [] };
		}

		return { success: true, data };
	} catch (e) {
		return { success: false, e, data: [] };
	}
}

export async function uploadJobsFromLinkedInToDB(jobListings: JobListing[]) {
	try {
		const formattedJobListings = jobListings.map((jobListing: JobListing) => ({
			...jobListing,
			job_id: `${jobListing.position}-${jobListing.company}-${jobListing.location}-${jobListing.date}`,
		}));

		const { data, error } = await supabase
			.from("linkedin-jobs") // Replace with your table name
			.upsert(formattedJobListings, {
				onConflict: "job_id",
			});

		if (error) {
			console.error("Error upserting jobs:", error);
			return { success: false, error };
		}

		console.log("Upserted jobs:", data);
		return { success: true, data };
	} catch (e) {
		return { success: false, e };
	}
}
