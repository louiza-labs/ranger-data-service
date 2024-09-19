// src/routes/alertsRoute.ts
import { Hono } from "hono";
import createAccountRoutes from "./create";
import getAccountRoutes from "./get";
import preferencesRoutes from "./preferences";
import verifyAccountRoutes from "./verify";
const accountRoute = new Hono();

accountRoute.route("/account/preferences", preferencesRoutes);
// for new accounts
accountRoute.route("/account", getAccountRoutes);
accountRoute.route("/account/create", createAccountRoutes);
accountRoute.route("/account/verify", verifyAccountRoutes);

export default accountRoute;
