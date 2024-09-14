// src/routes/alertsRoute.ts
import { Hono } from "hono";
import preferencesRoutes from "./preferences";
const accountRoute = new Hono();

accountRoute.route("/account/preferences", preferencesRoutes);

export default accountRoute;
