import { convertPreferencesFromDB, generateWarmIntros } from "../../lib/intros";
import { getPreferences } from "../../services/account/preferences";
import { getUser } from "../../services/account/user";
import { getLinkedinConnectionsFromDB } from "../../services/connections/linkedin";
import { sendEmail } from "../../services/email";

export async function sendEmailForUser(c: any) {
	// const { email, preferences } = await c.req.json();
	const { user_id } = await c.req.json();
	const { data: user } = await getUser({ user_id });
	const { data: recommendedProfiles } = await getLinkedinConnectionsFromDB();
	const { data: preferences } = await getPreferences({ user_id });
	const formattedPreferences = convertPreferencesFromDB(preferences);
	const warmIntros = generateWarmIntros(recommendedProfiles, formattedPreferences);
	await sendEmail({ recommendedProfiles: warmIntros, user });
	return c.json({ message: "Sent email!" });
}
