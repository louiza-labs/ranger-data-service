import { getLinkedinConnectionsFromDB } from "../../../services/connections/linkedin";

export async function fetchLinkedInConnectionsHandler(c: any) {
	const connections = await getLinkedinConnectionsFromDB();
	// const normalizedAlerts = normalizeAlertsData(con, "test", "los-angeles");
	return c.json(connections);
}
