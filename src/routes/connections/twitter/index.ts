// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchTwitterFollowersHandler } from "../../../handlers/connections/twitter";

const twitterConnectionsRoute = new Hono();

twitterConnectionsRoute.get("/:id", fetchTwitterFollowersHandler);

export default twitterConnectionsRoute;
