import { normalizeAlertsData } from "../../../lib/normalization";
import { fetchLosAngelesAlerts } from "../../../services/alerts";

export async function fetchLosAngelesAlertsHandler(c: any) {
	const alerts = await fetchLosAngelesAlerts();
	const normalizedAlerts = normalizeAlertsData(alerts, "test", "los-angeles");
	return c.json(normalizedAlerts);
}
