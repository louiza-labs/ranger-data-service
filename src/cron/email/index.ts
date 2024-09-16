import { convertPreferencesFromDB, generateWarmIntros } from "../../lib/intros";
import { getPreferences } from "../../services/account/preferences";
import { getUser } from "../../services/account/user";
import { getLinkedinConnectionsFromDB } from "../../services/connections/linkedin";
import { sendEmail } from "../../services/email";

async function sendEmailForUser({ user_id }: { user_id: string }) {
	// const { email, preferences } = await c.req.json();
	const { data: user } = await getUser({ user_id });
	const { data: recommendedProfiles } = await getLinkedinConnectionsFromDB();
	const { data: preferences } = await getPreferences({ user_id });
	const formattedPreferences = convertPreferencesFromDB(preferences);
	const warmIntros = generateWarmIntros(recommendedProfiles, formattedPreferences);
	await sendEmail({ recommendedProfiles: warmIntros, user });
	console.log("Email Sent!");
}

// Trigger the email sending function
(async () => {
	console.log("Running hourly email job");
	await sendEmailForUser({ user_id: "joetoledano" });
})();
