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
