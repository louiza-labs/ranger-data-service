import { filterConnectionsByCompanyPreferences, filterConnectionsByPositionPreferences } from "../../../lib/filtering";
import { getPreferences } from "../../../services/account/preferences";
import { getLinkedinConnectionsFromDB, uploadConnections } from "../../../services/connections/linkedin";
import { getJobsFromLinkedinFromDB } from "../../../services/jobs";

export async function fetchLinkedInConnectionsHandler(c: any) {
	const { user_id } = c.req.query();
	const connections = await getLinkedinConnectionsFromDB({ user_id });
	// const normalizedAlerts = normalizeAlertsData(con, "test", "los-angeles");
	return c.json(connections);
}

export async function fetchLinkedInConnectionsAtRelevantJobsHandler(c: any) {
	const user_id = c.req.query("user_id");

	// Fetch data from DB
	const { data: connections } = await getLinkedinConnectionsFromDB({ user_id });
	const { data: preferences } = await getPreferences({ user_id });
	const { data: jobs } = await getJobsFromLinkedinFromDB();

	// Filter connections who work at companies
	const filteredConnectionsForCompanies = connections.filter((connection) => connection.Company);

	// Get connections based on company preferences
	const connectionsMatchingCompanyPreferences = filterConnectionsByCompanyPreferences(
		filteredConnectionsForCompanies,
		jobs,
		preferences
	);

	// Get connections based on position preferences
	const connectionsMatchingPositionPreferences = filterConnectionsByPositionPreferences(
		filteredConnectionsForCompanies,
		jobs,
		preferences
	);

	// Union of both connection sets (removing duplicates)
	const unionOfConnections = Array.from(
		new Set([...connectionsMatchingCompanyPreferences, ...connectionsMatchingPositionPreferences])
	);
	// Return the filtered union of relevant connections
	return c.json(unionOfConnections);
}

export async function uploadConnectionsHandler(c: any) {
	const body = await c.req.json();

	const { user_id, connections } = body;

	try {
		const { success: connectionsUploaded } = await uploadConnections({ connections, user_id });
		if (!connectionsUploaded) throw new Error("Connections upload failed");

		return c.json({ message: "Success uploading connections", success: true });
	} catch (error) {
		return c.json({ message: error, success: false });
	}
}
