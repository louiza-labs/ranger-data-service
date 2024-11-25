interface IPreference {
	type: "position" | "company";
	value: string;
	user_id: string;
}

// Helper to filter connections by company preferences
// Helper to filter connections by company preferences and ensure the company has open job positions
export function filterConnectionsByCompanyPreferences(
	connections: any[],
	jobs: any[],
	preferences: IPreference[]
): any[] {
	return connections
		.map((connection: any) => {
			const matchingJob = jobs?.find((job: any) => job.company.toLowerCase() === connection.Company.toLowerCase());

			if (matchingJob) {
				const hasMatchingCompanyPreference = preferences.some(
					(preference) =>
						preference.type === "company" && preference.value.toLowerCase() === connection.Company.toLowerCase()
				);

				// If there's either a matching company or position preference, return the connection
				if (hasMatchingCompanyPreference) {
					return { ...connection, matchingJob }; // Return connection with the matching job
				}
			}
			return null; // No matching job or preferences
		})
		.filter((connection) => connection !== null); // Remove nulls
}

// Helper to filter connections by position preferences (matching jobs)
export function filterConnectionsByPositionPreferences(
	connections: any[],
	jobs: any[],
	preferences: IPreference[]
): any[] {
	return connections
		.map((connection: any) => {
			const matchingJob = jobs?.find((job: any) => job.company.toLowerCase() === connection.Company.toLowerCase());

			if (matchingJob) {
				const hasMatchingPosition = preferences.some(
					(preference) =>
						preference.type === "position" &&
						matchingJob.position.toLowerCase().includes(preference.value.toLowerCase())
				);

				if (hasMatchingPosition) {
					return { ...connection, matchingJob }; // Return connection with matching job
				}
			}
			return null; // No matching job/position
		})
		.filter((connection) => connection !== null); // Remove nulls
}
