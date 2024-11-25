import { getUser, getUserWithEmail } from "../../../services/account/user";

export async function getAccountHandler(c: any) {
	const { email, user_id } = c.req.query();
	if (email) {
		const { data, success } = await getUserWithEmail({ email });
		return c.json(data);
	} else if (user_id) {
		const { data, success } = await getUser({ user_id });
		return c.json(data);
	} else {
		return c.json({});
	}
}
