import { Connection, JobListing, Preference } from "../../../types";

export const generateWarmIntros = (connections: Connection[], preferences: Preference) => {
	// Create sets once outside the filter loop
	const positionsSet = new Set((preferences.position ?? []).map((pos) => pos.trim().toLowerCase()));
	const companiesSet = new Set((preferences.company ?? []).map((comp) => comp.trim().toLowerCase()));

	return connections.filter((connectionObj: Connection) => {
		const position = connectionObj.Position?.toLowerCase();
		const company = connectionObj.Company?.toLowerCase();

		// If neither position nor company is provided in the connection, don't match
		if (!position && !company) return false;

		// Match if no position preferences or position matches
		const positionMatch = positionsSet.size === 0 || (position && positionsSet.has(position));

		// Match if no company preferences or company matches
		const companyMatch = companiesSet.size === 0 || (company && companiesSet.has(company));

		// Filter logic:
		// - If both preferences are present, both must match.
		// - If only one preference exists, use that to filter.
		if (positionsSet.size > 0 && companiesSet.size > 0) {
			return positionMatch && companyMatch;
		} else if (positionsSet.size > 0) {
			return positionMatch;
		} else if (companiesSet.size > 0) {
			return companyMatch;
		} else {
			return false;
		}
	});
};
export const generateWarmIntrosByCompany = (connections: Connection[], limit = 5) => {
	const companyCounts = connections.reduce((acc, connection) => {
		const company = connection.Company?.toLowerCase();
		if (company) {
			acc[company] = (acc[company] || 0) + 1;
		}
		return acc;
	}, {} as Record<string, number>);

	const sortedCompanies = Object.entries(companyCounts)
		.sort(([, countA], [, countB]) => countB - countA)
		.slice(0, limit)
		.map(([company, count]) => ({ company, count })); // Return company with count

	return sortedCompanies;
};

export function convertPreferencesFromDB(
	preferences: {
		id: number;
		created_at: string;
		type: string;
		value: string;
		user_id: string;
	}[]
) {
	if (!preferences || !Array.isArray(preferences)) return preferences;

	const result: Preference = { position: [], company: [] };
	preferences.forEach((pref) => {
		if (pref.type === "company") {
			result.company.push(pref.value);
		} else if (pref.type === "position") {
			result.position.push(pref.value);
		}
	});

	return result;
}

interface PreferenceFromDB {
	id: number;
	created_at: string;
	type: string;
	value: string;
	user_id: string;
}

export const generateMatchingJobsForConnections = (
	connections: Connection[],
	preferences: PreferenceFromDB[],
	jobs: JobListing[],
	showAllJobs = false
) => {
	if (showAllJobs) {
		return jobs.filter((job: JobListing) =>
			connections.some((connection: Connection) => connection.Company?.toLowerCase() === job.company?.toLowerCase())
		);
	}

	const positionsSet = new Set(
		preferences
			.filter((preference: PreferenceFromDB) => preference.type === "position")
			.map((pos) => pos.value.trim().toLowerCase())
	);
	const companiesSet = new Set(
		preferences
			.filter((preference: PreferenceFromDB) => preference.type === "company")
			.map((comp) => comp.value.trim().toLowerCase())
	);

	return jobs
		.filter((job: JobListing) => {
			const jobPosition = job.position?.toLowerCase();
			const jobCompany = job.company?.toLowerCase();

			const positionMatch =
				positionsSet.size === 0 ||
				Array.from(positionsSet).some((preferredPosition) =>
					jobPosition.toLowerCase().includes(preferredPosition.toLowerCase())
				);

			const companyMatchesConnection = connections.some(
				(connection: Connection) => connection.Company?.toLowerCase() === jobCompany.toLowerCase()
			);

			const companyMatch = companiesSet.size === 0 || companiesSet.has(jobCompany);

			// If there are company preferences, the job must match the preference and have a connection
			const validCompanyMatch =
				companiesSet.size > 0 ? companyMatch && companyMatchesConnection : companyMatchesConnection;

			// The job must match the position and company conditions
			return positionMatch && validCompanyMatch; // This should only be true if both conditions are satisfied
		})
		.map((filteredJob: JobListing) => {
			const matchingConnection = connections.filter(
				(connection: Connection) =>
					connection.Company && connection.Company.toLowerCase() === filteredJob.company.toLowerCase()
			);
			return {
				...filteredJob,
				matchingConnection,
			};
		});
};
