import { getTwitterFollowersg } from "../../../services/connections/twitter";

export async function fetchTwitterFollowersHandler(c: any) {
	try {
		const userIdParam = c.req.param("id");
		const twitterFollowersRes = await getTwitterFollowersg();
		// const normalizedAlerts = normalizeAlertsData(alerts, "test", "los-angeles");
		return c.json(twitterFollowersRes);
	} catch (e) {
		return c.json(e);
	}
}
