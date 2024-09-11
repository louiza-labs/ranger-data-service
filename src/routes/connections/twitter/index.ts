// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchNewYork311AlertHandler } from "../../../handlers/alerts";

const twitterConnectionsRoute = new Hono();

twitterConnectionsRoute.get("/", fetchNewYork311AlertHandler);

export default twitterConnectionsRoute;
