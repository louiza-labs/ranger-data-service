import { addSubscriber } from "../../services";

export async function subscribeHandler(c: any) {
	const { email, preferences } = await c.req.json();
	await addSubscriber(email, preferences);
	return c.json({ message: "Subscription successful!" });
}
