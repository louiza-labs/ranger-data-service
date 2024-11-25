export function addJobToConnection(connections: any[], jobs: any[]): any[] {
	return connections
		.map((connection: any) => {
			const matchingJob = jobs?.find((job: any) => job.company.toLowerCase() === connection.Company.toLowerCase());

			if (matchingJob) {
				return { ...connection, matchingJob }; // Return connection with matching job
			}
		})
		.filter((connection) => connection !== null); // Remove nulls
}

type JobListing = {
	position: string;
	company: string;
	companyLogo: string;
	location: string;
	date: string;
	agoTime: string;
	salary: string;
	jobUrl: string;
	job_id: string;
};

type Connection = {
	"First Name": string;
	"Last Name": string;
	UserName: string;
	URL: string;
	"Email Address": string;
	Company: string;
	Position: string;
	"Connected On": string;
	user_id_for_connection: string;
	user_id_username_identifier: string;
};

export function getCompaniesWithJobsFromConnections(jobListings: JobListing[], connections: Connection[]) {
	// Create a map to store occurrences of 'Company' from connections array
	const companyMap = new Map<
		string,
		{ count: number; matchingJobs: JobListing[]; companyLogo?: string; connections: Connection[] }
	>();

	// Populate the map with 'Company' from connections array
	connections.forEach((connection) => {
		const companyName = connection.Company;
		if (!companyMap.has(companyName)) {
			companyMap.set(companyName, { count: 0, matchingJobs: [], connections: [connection] });
		} else if (companyMap.get(companyName)) {
			companyMap.get(companyName)?.connections.push(connection);
		}
		companyMap.get(companyName)!.count += 1;
	});

	// Now go through jobListings and match with 'company'
	jobListings.forEach((job) => {
		const companyName = job.company;
		if (companyMap.has(companyName)) {
			const companyData = companyMap.get(companyName)!;

			// If the companyLogo is not yet set, assign it from this job listing
			if (!companyData.companyLogo) {
				companyData.companyLogo = job.companyLogo;
			}

			companyData.matchingJobs.push(job);
		}
	});

	// Convert the map to an array, and sort by the count
	const result = Array.from(companyMap.entries()).map(
		([Company, { count, matchingJobs, companyLogo, connections }]) => ({
			Company,
			count,
			companyLogo,
			connections,
			matchingJobs,
		})
	);

	// Sort the result by count in descending order
	return result.sort((a, b) => b.count - a.count);
}

export function getAllCompaniesFromConnections(jobListings: JobListing[], connections: Connection[]) {
	// Create a map to store occurrences of 'Company' from connections array
	const companyMap = new Map<
		string,
		{ count: number; companyLogo?: string; connections: Connection[]; matchingJobs: JobListing[] }
	>();

	// Populate the map with 'Company' from connections array
	connections.forEach((connection) => {
		const companyName = connection.Company;
		if (!companyMap.has(companyName)) {
			companyMap.set(companyName, { count: 0, matchingJobs: [], connections: [connection] });
		} else {
			companyMap.get(companyName)?.connections.push(connection);
		}
		companyMap.get(companyName)!.count += 1;
	});

	// Go through jobListings and match with 'company' while updating companyLogo if needed
	jobListings.forEach((job) => {
		const companyName = job.company;
		if (companyMap.has(companyName)) {
			const companyData = companyMap.get(companyName)!;

			// If the companyLogo is not yet set, assign it from this job listing
			if (!companyData.companyLogo) {
				companyData.companyLogo = job.companyLogo;
			}

			// Add the job to the matchingJobs array
			companyData.matchingJobs.push(job);
		}
	});

	// Convert the map to an array, keeping all companies from connections
	const result = Array.from(companyMap.entries()).map(
		([Company, { count, companyLogo, connections, matchingJobs }]) => ({
			Company,
			count,
			companyLogo,
			connections,
			matchingJobs,
		})
	);

	// Sort the result by count in descending order
	return result.sort((a, b) => b.count - a.count);
}

// Helper function to extract relevant data and normalize
export function normalizeJobData(rawJobs: any[]): JobListing[] {
	return rawJobs.map((rawJob) => {
		// Assuming the date is provided in a way that you can calculate the agoTime (e.g., days ago)
		const agoTime = rawJob.date ? calculateAgoTime(rawJob.date) : "N/A";

		return {
			position: rawJob.title || "N/A",
			company: rawJob.company || "N/A",
			companyLogo: rawJob.companyImgLink || "N/A",
			location: rawJob.place || "N/A",
			date: rawJob.date || "N/A",
			agoTime: agoTime,
			salary: rawJob.insights?.salary || "N/A", // If salary is stored in insights or similar field
			jobUrl: rawJob.link || "N/A",
			job_id: rawJob.id || "N/A",
		};
	});
}

// Optional: A function to calculate 'agoTime' from the date (example for days ago)
function calculateAgoTime(dateString: string): string {
	const jobDate = new Date(dateString);
	const currentDate = new Date();
	const diffTime = Math.abs(currentDate.getTime() - jobDate.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays > 1 ? `${diffDays} days ago` : "1 day ago";
}
