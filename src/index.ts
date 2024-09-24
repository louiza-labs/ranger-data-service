import { Hono } from "hono";
import { logger } from "hono/logger";

import { bearerAuth } from "hono/bearer-auth";

import accountRoute from "./routes/account";
import companiesRoute from "./routes/companies";
import connectionsRoute from "./routes/connections";
import emailsRoute from "./routes/email";
import jobsRoute from "./routes/jobs";
import subscriptionRoute from "./routes/subscribe";

const app = new Hono();
app.use(logger());
app.use(bearerAuth({ token: process.env.VALID_API_KEY ?? "😭" }));

// Use the routes
app.route("/api", subscriptionRoute);
app.route("/api", connectionsRoute);
app.route("/api", jobsRoute);
app.route("/api", accountRoute);
app.route("/api", emailsRoute);
app.route("/api", companiesRoute);

export default app;
