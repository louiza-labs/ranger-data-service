import { Hono } from "hono";
import { getRelevantJobsByConnectionsAndPreferences, getScrapedJobsHandler } from "../../handlers/jobs";

const jobsRoute = new Hono();

jobsRoute.get("/jobs/relevant_jobs", getRelevantJobsByConnectionsAndPreferences);
jobsRoute.get("/jobs/get_and_upload", getScrapedJobsHandler);

export default jobsRoute;
