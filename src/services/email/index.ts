var postmark = require("postmark");

interface sendEmailProps {
	subject: string;
}

interface Connection {
	"First Name": string;
	"Last Name": string;
	Username: string;
	URL: string;
	"Email Address": string | null;
	Company: string;
	Position: string;
	"Connected On": string;
}

type ExtractedProfile = {
	profile_name: string;
	profile_position: string;
	profile_company: string;
	profile_url: string;
};

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

const extractProfiles = (connections: Connection[]): ExtractedProfile[] => {
	return connections.map((connection) => ({
		profile_name: `${connection["First Name"]} ${connection["Last Name"]}`,
		profile_position: connection.Position,
		profile_company: connection.Company,
		profile_url: connection.URL,
	}));
};

interface sendEmailArgs {
	recommendedProfiles: Connection[];
	recommendedPositions: JobListing[];
	user: any;
}

export const sendEmail = async (args: sendEmailArgs) => {
	const { recommendedProfiles, recommendedPositions, user } = args;
	var client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

	// Extract the profile details
	const extractedProfiles = extractProfiles(recommendedProfiles);

	// Prepare the template model with extracted profiles
	const templateModel: Record<string, string> = {
		product_url: "product_url_Value",
		product_name: "Warm Intros",
		name: user.name,
		company_name: "Louiza",
		// company_address: "company_address_Value",
		// action_url: "action_url_Value",
		// login_url: "login_url_Value",
		username: user.name,
		// trial_length: "trial_length_Value",
		// trial_start_date: "trial_start_date_Value",
		// trial_end_date: "trial_end_date_Value",
		support_email: "joe@louiza,xyz",
		// live_chat_url: "live_chat_url_Value",
		sender_name: "The Warm Intro Nudger",
		help_url: "help_url_Value",
	};

	// Map the extracted profiles to the template fields
	extractedProfiles.forEach((profile, index) => {
		const profileNumber = index + 1; // rec_1, rec_2, etc.
		templateModel[`rec_${profileNumber}_profile_name`] = profile.profile_name;
		templateModel[`rec_${profileNumber}_profile_position`] = profile.profile_position;
		templateModel[`rec_${profileNumber}_profile_company`] = profile.profile_company;
		templateModel[`rec_${profileNumber}_profile_url`] = profile.profile_url;
	});

	recommendedPositions.forEach((position, index) => {
		const positionNumber = index + 1; // pos_1, pos_2, etc.
		templateModel[`pos_${positionNumber}_company`] = position.company;
		templateModel[`pos_${positionNumber}_position`] = position.position;
		templateModel[`pos_${positionNumber}_jobUrl`] = position.jobUrl;
	});

	// Send the email with the template and the filled-in profile information
	await client.sendEmailWithTemplate({
		From: "joe@louiza.xyz",
		To: user.email,
		TemplateAlias: "code-your-own-4",
		TemplateModel: templateModel,
	});
};
