// src/routes/alertsRoute.ts
import { Hono } from "hono";
import losAngelesRoutes from "./losAngeles";
import newYorkRoutes from "./newYork";
const alertsRoute = new Hono();

alertsRoute.route("/alerts/new-york", newYorkRoutes);
alertsRoute.route("/alerts/los-angeles", losAngelesRoutes);

export default alertsRoute;
