export function addJobToConnection(connections: any[], jobs: any[]): any[] {
	return connections
		.map((connection: any) => {
			const matchingJob = jobs?.find((job: any) => job.company.toLowerCase() === connection.Company.toLowerCase());

			if (matchingJob) {
				return { ...connection, matchingJob }; // Return connection with matching job
			}
		})
		.filter((connection) => connection !== null); // Remove nulls
}
