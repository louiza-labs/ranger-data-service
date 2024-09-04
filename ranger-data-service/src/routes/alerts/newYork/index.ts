// src/routes/alertsRoute.ts
import { Hono } from "hono";
import {
	fetchNewYork311AlertHandler,
	fetchNewYorkEmergencyNotificationsAlertHandler,
	fetchNewYorkEmergencyServicesAlertHandler,
} from "../../../handlers/alerts";

const alertsRoute = new Hono();

alertsRoute.get("/311", fetchNewYork311AlertHandler);
alertsRoute.get("/emergency-services", fetchNewYorkEmergencyServicesAlertHandler);
alertsRoute.get("/emergency-notifications", fetchNewYorkEmergencyNotificationsAlertHandler);

export default alertsRoute;
