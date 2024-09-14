import { Hono } from "hono";
import { logger } from "hono/logger";

import accountRoute from "./routes/account";
import alertsRoute from "./routes/alerts";
import connectionsRoute from "./routes/connections";
import subscriptionRoute from "./routes/subscribe";

const app = new Hono();
app.use(logger());

// Use the routes
app.route("/api", alertsRoute);
app.route("/api", subscriptionRoute);
app.route("/api", connectionsRoute);
app.route("/api", accountRoute);

export default {
	port: 3000,
	fetch: app.fetch,
};
