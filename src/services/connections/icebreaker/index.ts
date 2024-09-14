import axios from "axios";

const icebreakerAPIURL = "https://app.icebreaker.xyz/api/v1/";
export async function fetchIcebreakerConnections(id: string) {
	try {
		const response = await axios.get(icebreakerAPIURL, {
			timeout: 10000,
		});

		// Map the response data to the desired format
		return response.data;
	} catch (e) {
		console.log(e);
	}
}
