import { Hono } from "hono";
import alertsRoute from "./routes/alerts";
import subscriptionRoute from "./routes/subscribe";

const app = new Hono();
// Use the routes
app.route("/api", alertsRoute);
app.route("/api", subscriptionRoute);

export default app;
