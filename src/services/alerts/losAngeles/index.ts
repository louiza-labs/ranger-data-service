import axios from "axios";

export async function fetchNewYorkAlerts() {
	try {
		const response = await axios.get("https://data.cityofnewyork.us/resource/erm2-nwe9.json");

		// Map the response data to the desired format
		return response.data;
	} catch (e) {
		console.log(e);
	}
}

export async function fetchLosAngelesAlerts() {
	return [
		{ type: "Missing Pet", location: "NYC", details: "Lost cat in Brooklyn" },
		{ type: "Road Closure", location: "LA", details: "Main St. closed due to construction" },
	];
}
