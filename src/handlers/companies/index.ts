import { getLinkedinConnectionsFromDB } from "../../services/connections/linkedin";
import { getJobsFromLinkedinFromDB } from "../../services/jobs";

import { matchJobsWithConnections } from "../../lib/normalization";

export async function fetchCompaniesHandler(c: any) {
	const { user_id } = c.req.query();
	const { data: connections } = await getLinkedinConnectionsFromDB({ user_id });
	const { data: jobs } = await getJobsFromLinkedinFromDB();
	const filteredConnections = connections.filter((connection: any) => connection.Company);

	const resultsByCompany = matchJobsWithConnections(jobs, connections);
	// const normalizedAlerts = normalizeAlertsData(con, "test", "los-angeles");
	return c.json(resultsByCompany);
}
