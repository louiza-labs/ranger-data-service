export const RELEVANT_HEADERS = ["Subject", "From", "To", "Date"];

export const COMPANY_NAME_BLACKLIST: string[] = ["ltd", "inc", "llc" /* ... other words ... */];

export const FETCH_TIMEOUT = 120000;
export const PROCESSING_TIMEOUT = 180000;
export const BATCH_SIZE = 5;
export const PROCESSING_DELAY = 2000;
export const MAX_RETRIES = 5;
export const INITIAL_BACKOFF = 1000;
export const MAX_CONCURRENT_REQUESTS = 3;
export const CACHE_DURATION = 24 * 60 * 60 * 1000;
export const USE_DUMMY_AI = true;

export const SUBJECT_KEYWORDS = [
	// Application stage
	"applied",
	"application",
	"your application",
	"job application",
	"position application",
	"resume received",
	"application received",
	"application submitted",

	// Interest and initial contact
	"your interest",
	"interest in",
	"regarding your interest",
	"thank you for your interest",
	"exploring opportunities",
	"career opportunities",

	// Screening and initial assessment
	"initial screening",
	"phone screening",
	"preliminary assessment",
	"skills assessment",
	"coding challenge",
	"technical assessment",
	"take-home assignment",

	// Interview process
	"interview",
	"interview invitation",
	"schedule an interview",
	"interview confirmation",
	"phone interview",
	"video interview",
	"on-site interview",
	"final round",
	"meet the team",
	"interview feedback",

	// Follow-up and status updates
	"application status",
	"status update",
	"next steps",
	"follow-up",

	// Offer stage
	"job offer",
	"offer letter",
	"employment offer",
	"congratulations",

	// Rejection and closure
	"application status update",
	"thank you for applying",
	"position filled",
	"not moving forward",
	"other candidates",
	"future opportunities",
];

// Add new constant for tracking-specific keywords
export const TRACKING_KEYWORDS = [
	// Status Updates
	"status update",
	"application status",
	"under review",
	"in review",
	"being reviewed",

	// Interview Process
	"schedule interview",
	"interview invitation",
	"technical interview",
	"phone screen",
	"next round",
	"meet the team",

	// Decisions
	"offer",
	"decision",
	"moved forward",
	"next steps",
	"unfortunately",
	"regret to inform",
	"pleased to inform",
	"congratulations",

	// Follow-up
	"follow up",
	"following up",
	"next stage",
	"feedback",

	// Assessment
	"assessment",
	"coding challenge",
	"technical test",
	"take home",
	"assignment",
];
