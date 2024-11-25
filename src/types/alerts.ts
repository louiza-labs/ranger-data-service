export interface INormalizedAlertsData {
	id: string | null;
	date: string | null;
	type: string;
	description: string;
	location: {
		address: string;
		cross_streets: string | null;
		city: string;
		borough: string | null;
		zip: string | null;
		latitude: string | null;
		longitude: string | null;
	};
	agency: string | null;
	status: string | null;
	resolution_date: string | null;
	community_board: string | null;
	source: string;
	city: string;
}
