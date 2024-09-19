export interface Connection {
	"First Name": string;
	"Last Name": string;
	Username: string;
	URL: string;
	"Email Address": string | null;
	Company: string;
	Position: string;
	"Connected On": string;
}

export interface Preference {
	position: string[];
	company: string[];
}

export interface JobListing {
	position: string;
	company: string;
	companyLogo: string;
	location: string;
	date: string;
	agoTime: string;
	salary: string;
	jobUrl: string;
	job_id: string;
}
