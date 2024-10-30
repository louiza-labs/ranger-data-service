import { Hono } from "hono";
import { getApplicationsHandler, updateApplicationStatusHandler } from "../../handlers/applications";

const app = new Hono();

app.put("/api/applications/:applicationId/status", updateApplicationStatusHandler);
app.get("/applications", getApplicationsHandler);

export default app;
