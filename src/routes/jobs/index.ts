import { Hono } from "hono";
import { getJobs, getRelevantJobsByConnectionsAndPreferences } from "../../handlers/jobs";
import { cacheMiddleware } from "../../middleware/cache";

const jobsRoute = new Hono();

jobsRoute.get("/jobs", getJobs);
jobsRoute.use("/jobs/relevant_jobs", cacheMiddleware("/jobs/relevant_jobs"));
jobsRoute.get("/jobs/relevant_jobs", getRelevantJobsByConnectionsAndPreferences);

export default jobsRoute;
