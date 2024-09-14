import axios from "axios";

export async function fetch311Alerts() {
	try {
		const response = await axios.get("https://data.cityofnewyork.us/resource/erm2-nwe9.json", {
			headers: {
				"X-App_Token": process.env.NYC_OPEN_DATA_APP_TOKEN, // Add the HTTP header
			},
			timeout: 10000,
		});

		// Map the response data to the desired format
		return response.data;
	} catch (e) {
		console.log(e);
	}
}

export async function fetchEmergencyServicesAlerts() {
	try {
		const response = await axios.get("https://data.cityofnewyork.us/resource/pasr-j7fb.json", {
			headers: {
				"X-App_Token": process.env.NYC_OPEN_DATA_APP_TOKEN, // Add the HTTP header
			},
		});

		// Map the response data to the desired format
		return response.data;
	} catch (e) {
		console.log(e);
	}
}

export async function fetchEmergencyNotifications() {
	try {
		const url = "https://data.cityofnewyork.us/resource/8vv7-7wx3.json";
		const response = await axios.get(url, {
			headers: {
				"X-App_Token": process.env.NYC_OPEN_DATA_APP_TOKEN, // Add the HTTP header
			},
		});

		// Map the response data to the desired format
		return response.data;
	} catch (e) {
		console.log(e);
	}
}
