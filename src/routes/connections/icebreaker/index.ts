// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchNewYork311AlertHandler } from "../../../handlers/alerts";

const iceBreakerConnectionsRoute = new Hono();

iceBreakerConnectionsRoute.get("/", fetchNewYork311AlertHandler);

export default iceBreakerConnectionsRoute;
