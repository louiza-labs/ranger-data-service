import { verifyUsernameAndEmail } from "../../../services/account/verify";

export async function verifyAccountHandler(c: any) {
	const query = await c.req.query();

	const { email, username } = query;

	try {
		const { success, data: accountLookupResults } = await verifyUsernameAndEmail({
			username,
			email,
		});

		return c.json({ message: "Success looking up account", accountLookupResults, success });
	} catch (error) {
		return c.json({ message: error, success: false });
	}
}
