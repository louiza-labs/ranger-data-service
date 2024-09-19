// Dummy function to represent your API key validation (could be a DB check)
const validApiKeys = [process.env.VALID_API_KEY]; // Example valid API keys
const isValidApiKey = (key: string) => validApiKeys.includes(key);

// Middleware to check API Key
export const apiKeyAuthMiddleware = async (c: any, next: Function) => {
	const apiKey = c.req.header("x-api-key");

	if (!apiKey || !isValidApiKey(apiKey)) {
		return c.json({ message: "Unauthorized: Invalid API Key" }, 401);
	}

	await next();
};
