export async function addSubscriber(email: string, preferences: any) {
	console.log(`Subscriber added: ${email} with preferences: ${JSON.stringify(preferences)}`);
}
