import { normalizeAlertsData } from "../../../lib/normalization";
import {
	fetch311Alerts,
	fetchEmergencyNotifications,
	fetchEmergencyServicesAlerts,
} from "../../../services/alerts/newYork";

export async function fetchNewYork311AlertHandler(c: any) {
	const alerts = await fetch311Alerts();
	const normalizedAlerts = normalizeAlertsData(alerts, "311", "new-york");
	return c.json(normalizedAlerts);
}

export async function fetchNewYorkEmergencyServicesAlertHandler(c: any) {
	const alerts = await fetchEmergencyServicesAlerts();
	const normalizedAlerts = normalizeAlertsData(alerts, "emergency-services", "new-york");
	return c.json(normalizedAlerts);
}

export async function fetchNewYorkEmergencyNotificationsAlertHandler(c: any) {
	const alerts = await fetchEmergencyNotifications();
	const normalizedAlerts = normalizeAlertsData(alerts, "emergency-services", "new-york");
	return c.json(normalizedAlerts);
}
