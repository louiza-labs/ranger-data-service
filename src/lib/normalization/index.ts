import { INormalizedAlertsData } from "../../types/alerts";

export function normalizeAlertsData(objects: any[], source: string, city: string): INormalizedAlertsData[] {
	return objects.map((obj) => {
		return {
			id: obj.unique_key || obj.record_id || null,
			date: obj.created_date || obj.creation_date || obj.date_and_time || null,
			type: obj.complaint_type || obj.incident_type || obj.notificationtype || "Unknown",
			description:
				obj.descriptor ||
				obj.notification_title ||
				obj.email_body ||
				obj.resolution_description ||
				"No Description Available",
			location: {
				address: obj.incident_address || obj.location || obj.street_name || "No Address Available",
				cross_streets:
					obj.cross_street_1 && obj.cross_street_2 ? `${obj.cross_street_1} & ${obj.cross_street_2}` : null,
				city: obj.city || city || "Unknown City",
				borough: obj.borough || obj.park_borough || null,
				zip: obj.incident_zip || null,
				latitude: obj.latitude || null,
				longitude: obj.longitude || null,
			},
			agency: obj.agency_name || obj.agency || null,
			status: obj.status || null,
			resolution_date: obj.closed_date || obj.resolution_action_updated_date || null,
			community_board: obj.community_board || null,
			source: source,
			city: city,
		};
	});
}
