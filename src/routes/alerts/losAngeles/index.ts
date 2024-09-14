// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchLosAngelesAlertsHandler } from "../../../handlers/alerts";

const alertsRoute = new Hono();

alertsRoute.get("/alerts/los-angeles", fetchLosAngelesAlertsHandler);

export default alertsRoute;
