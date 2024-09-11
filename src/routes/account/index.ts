// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { fetchNewYork311AlertHandler } from "../../handlers/alerts";

const accountRoute = new Hono();

accountRoute.get("/", fetchNewYork311AlertHandler);

export default accountRoute;
