// src/routes/alertsRoute.ts
import { Hono } from "hono";
import preferencesRoutes from "./preferences";
const accountRoute = new Hono();

accountRoute.route("/account/preferences", preferencesRoutes);
// for new accounts
accountRoute.route("/account/create", preferencesRoutes);

export default accountRoute;
