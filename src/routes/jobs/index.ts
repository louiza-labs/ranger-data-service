import { Hono } from "hono";
import { getJobs } from "../../handlers/jobs";

const jobsRoute = new Hono();

jobsRoute.get("/jobs", getJobs);

export default jobsRoute;
