import { getJobsFromLinkedin } from "../../services/jobs";

export async function getJobs(c: any) {
	// const { email, preferences } = await c.req.json();
	const result = await getJobsFromLinkedin({});
	return c.json(result);
}
