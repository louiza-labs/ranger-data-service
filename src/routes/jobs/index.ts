import { Hono } from "hono";
import { getJobs, getRelevantJobsByConnectionsAndPreferences } from "../../handlers/jobs";

const jobsRoute = new Hono();

jobsRoute.get("/jobs", getJobs);
jobsRoute.get("/jobs/relevant_jobs", getRelevantJobsByConnectionsAndPreferences);

export default jobsRoute;
