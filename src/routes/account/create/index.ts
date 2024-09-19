// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { createAccountHandler } from "../../../handlers/account/create";

const createAccountRoute = new Hono();

createAccountRoute.post("/", createAccountHandler);

export default createAccountRoute;
