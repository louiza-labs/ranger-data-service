// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchLinkedInConnectionsHandler } from "../../../handlers/connections/linkedin";

const linkedInConnectionsRoute = new Hono();

linkedInConnectionsRoute.get("/", fetchLinkedInConnectionsHandler);

export default linkedInConnectionsRoute;
