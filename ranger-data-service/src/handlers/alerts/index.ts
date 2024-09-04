import { fetchAlerts } from "../../services/alerts";

export async function fetchAlertsHandler(c: any) {
	const alerts = await fetchAlerts();
	return c.json(alerts);
}
