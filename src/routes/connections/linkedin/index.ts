// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchNewYork311AlertHandler } from "../../../handlers/alerts";

const linkedInConnectionsRoute = new Hono();

linkedInConnectionsRoute.get("/", fetchNewYork311AlertHandler);

export default linkedInConnectionsRoute;
