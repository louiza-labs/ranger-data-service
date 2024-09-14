import { Hono } from "hono";
import icebreakerRoutes from "./icebreaker";
import linkedInRoutes from "./linkedin";
import twitterRoutes from "./twitter";
const connectionsRoute = new Hono();

connectionsRoute.route("/connections/icebreaker", icebreakerRoutes);
connectionsRoute.route("/connections/linkedin", linkedInRoutes);
connectionsRoute.route("/connections/twitter", twitterRoutes);

export default connectionsRoute;
