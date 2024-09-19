// src/routes/alertsRoute.ts
import { Hono } from "hono";
import {
	fetchLinkedInConnectionsAtRelevantJobsHandler,
	fetchLinkedInConnectionsHandler,
} from "../../../handlers/connections/linkedin";

const linkedInConnectionsRoute = new Hono();

linkedInConnectionsRoute.get("/", fetchLinkedInConnectionsHandler);
linkedInConnectionsRoute.get("/get_relevant_connections_for_jobs", fetchLinkedInConnectionsAtRelevantJobsHandler);

export default linkedInConnectionsRoute;
