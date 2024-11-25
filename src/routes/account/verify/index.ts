// src/routes/alertsRoute.ts
import { Hono } from "hono";
import { verifyAccountHandler } from "../../../handlers/account/verify";

const verifyAccountRoute = new Hono();

verifyAccountRoute.get("/verify_email_and_username", verifyAccountHandler);

export default verifyAccountRoute;
