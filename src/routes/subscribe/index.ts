// src/routes/subscriptionRoute.ts
import { Hono } from "hono";
import { subscribeHandler } from "../../handlers/subscribe";

const subscriptionRoute = new Hono();

subscriptionRoute.post("/subscribe", subscribeHandler);

export default subscriptionRoute;
