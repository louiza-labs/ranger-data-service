// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { getAccountHandler } from "../../../handlers/account/get";

const getAccountRoute = new Hono();

getAccountRoute.get("/", getAccountHandler);

export default getAccountRoute;
