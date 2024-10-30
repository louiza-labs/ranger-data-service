import { Hono } from "hono";

import { handleGetAllEmails, handleGetEmails } from "../../handlers/emails/gmail";
type Variables = {
	jwtPayload: {
		sub: string; // User ID
		exp: number; // Token expiration
	};
};
const emails = new Hono();

emails.get("/emails/google", handleGetEmails);
emails.get("/emails/google/all", handleGetAllEmails);
export default emails;
