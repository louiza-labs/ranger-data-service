import { getJobsFromLinkedin, getJobsFromLinkedinFromDB, uploadJobsFromLinkedInToDB } from "../../services/jobs";

export async function getJobs(c: any) {
	const { page, keyword, location, dateSincePosted, limit } = await c.req.query();

	const { data: jobsFetchedFromLinkedin } = await getJobsFromLinkedin({
		page,
		keyword,
		location,
		dateSincePosted,
		limit,
	});

	const { data: jobsFromDB } = await getJobsFromLinkedinFromDB();

	if (jobsFromDB?.length && jobsFetchedFromLinkedin?.length) {
		// Filter jobs that are not already in the DB
		const filteredJobsFromLinkedin = jobsFetchedFromLinkedin.filter(
			(job: any) => !jobsFromDB.find((jobFromDB: any) => job.jobUrl === jobFromDB.jobUrl)
		);

		if (filteredJobsFromLinkedin.length) {
			// Upload new jobs
			const res = await uploadJobsFromLinkedInToDB(filteredJobsFromLinkedin);
			return c.json([...filteredJobsFromLinkedin, jobsFromDB]);
		}
	} else if (jobsFetchedFromLinkedin?.length) {
		// No jobs in DB, upload all fetched jobs
		const res = await uploadJobsFromLinkedInToDB(jobsFetchedFromLinkedin);
		return c.json(jobsFetchedFromLinkedin);
	}

	// If no jobs were fetched or uploaded, return an empty response
	return c.json({ message: "No new jobs to upload" });
}
