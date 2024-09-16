// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchLinkedInConnectionsHandler } from "../../../handlers/connections/linkedin";

const iceBreakerConnectionsRoute = new Hono();

iceBreakerConnectionsRoute.get("/", fetchLinkedInConnectionsHandler);

export default iceBreakerConnectionsRoute;
