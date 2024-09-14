// src/routes/alertsRoute.ts
import { Hono } from "hono";
import {
	addPreferenceForUser,
	getPreferenceForUser,
	removePreferenceForUser,
} from "../../../handlers/account/preferences";

const preferencesRoute = new Hono();

preferencesRoute.get("/", getPreferenceForUser);
preferencesRoute.post("/add_preference", addPreferenceForUser);
preferencesRoute.delete("/remove_preference/:preference_name/:preference_value/:user_id", removePreferenceForUser);

export default preferencesRoute;
