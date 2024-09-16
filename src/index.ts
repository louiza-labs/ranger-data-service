import { Hono } from "hono";
import { logger } from "hono/logger";

import accountRoute from "./routes/account";
import alertsRoute from "./routes/alerts";
import connectionsRoute from "./routes/connections";
import emailsRoute from "./routes/email";
import subscriptionRoute from "./routes/subscribe";

const app = new Hono();
app.use(logger());

// Use the routes
app.route("/api", alertsRoute);
app.route("/api", subscriptionRoute);
app.route("/api", connectionsRoute);
app.route("/api", accountRoute);
app.route("/api", emailsRoute);

export default {
	port: 8000,
	fetch: app.fetch,
};
