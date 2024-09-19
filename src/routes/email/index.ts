// src/routes/subscriptionRoute.ts
import { Hono } from "hono";
import { sendEmailForUser } from "../../handlers/email";

const emailsRoute = new Hono();

emailsRoute.post("/email", sendEmailForUser);

export default emailsRoute;
