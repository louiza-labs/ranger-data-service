// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchIcebreakerConnections } from "../../../handlers/connections/icebreaker";

const iceBreakerConnectionsRoute = new Hono();

iceBreakerConnectionsRoute.get("/", fetchIcebreakerConnections);

export default iceBreakerConnectionsRoute;
