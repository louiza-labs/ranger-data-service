import { normalizeAlertsData } from "../../lib/normalization";
import { fetchLosAngelesAlerts } from "../../services/alerts";

export async function addPreferenceForUser(c: any) {
	const body = await c.req.parseBody();
	const { type, value, user_id } = body;

	const alerts = await fetchLosAngelesAlerts();
	const normalizedAlerts = normalizeAlertsData(alerts, "test", "los-angeles");
	return c.json(normalizedAlerts);
}

export async function removePreferenceForUser(c: any) {
	const alerts = await fetchLosAngelesAlerts();
	const normalizedAlerts = normalizeAlertsData(alerts, "test", "los-angeles");
	return c.json(normalizedAlerts);
}
