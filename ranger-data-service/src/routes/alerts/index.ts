// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchAlertsHandler } from "../../handlers/alerts";

const alertsRoute = new Hono();

alertsRoute.get("/alerts", fetchAlertsHandler);

export default alertsRoute;
