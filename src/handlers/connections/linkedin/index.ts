import { getPreferences } from "../../../services/account/preferences";
import { getLinkedinConnectionsFromDB } from "../../../services/connections/linkedin";
import { getJobsFromLinkedinFromDB } from "../../../services/jobs/";

export async function fetchLinkedInConnectionsHandler(c: any) {
	const connections = await getLinkedinConnectionsFromDB();
	// const normalizedAlerts = normalizeAlertsData(con, "test", "los-angeles");
	return c.json(connections);
}

export async function fetchLinkedInConnectionsAtRelevantJobsHandler(c: any) {
	const user_id = c.req.query("user_id");
	const { data: connections } = await getLinkedinConnectionsFromDB();
	const { data: preferences } = await getPreferences({ user_id });
	const { data: jobs } = await getJobsFromLinkedinFromDB();

	const filteredConnectionsForCompanies = connections.filter((connection) => connection.Company);

	const connectionsWithMatchingCompanyPreferences = filteredConnectionsForCompanies.filter((connection: any) => {
		return preferences.find(
			(preference) =>
				preference.type === "company" && preference.value.toLowerCase() === connection.Company.toLowerCase()
		);
	});

	const connectionsAtRelevantCompaniesWithOpenPositions = connectionsWithMatchingCompanyPreferences
		.map((connection: any) => {
			const matchingJob = jobs?.find((job: any) => job.company.toLowerCase() === connection.Company.toLowerCase());
			if (matchingJob) {
				return { ...connection, matchingJob }; // Add matching job to connection
			}
			return null; // Return null if no matching job
		})
		.filter((connection) => connection !== null); // Filter out null values

	// const normalizedAlerts = normalizeAlertsData(con, "test", "los-angeles");
	return c.json(connectionsAtRelevantCompaniesWithOpenPositions);
}
