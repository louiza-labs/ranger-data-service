import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const determineEmailType = async (emailContent: string, isSubject: boolean) => {
	const prompt = `Analyze the following email ${
		isSubject ? "subject" : "body"
	} and determine if it refers to a job application, interview, rejection, or offer. The email content is: "${emailContent}"`;

	const result = await generateObject({
		model: openai("gpt-4o"),
		prompt,
		maxRetries: 3,
		maxTokens: 100,
		schema: z.object({
			emailType: z.enum(["application", "interview", "rejection", "offer", "other"]),
			confidence: z.number().min(0).max(1),
		}),
	});

	return result.object;
};

export const determineRecruitmentStatus = async (emailContent: string, isSubject: boolean) => {
	const prompt = `Analyze the following email ${
		isSubject ? "subject" : "body"
	} and determine the status in the recruitment process it refers to (applied, interviewing, rejected, offer, or accepted). The email content is: "${emailContent}"`;

	const result = await generateObject({
		model: openai("gpt-4o"),
		prompt,
		maxRetries: 3,
		maxTokens: 100,
		schema: z.object({
			status: z.enum(["applied", "interviewing", "rejected", "offer", "accepted", "unknown"]),
			confidence: z.number().min(0).max(1),
		}),
	});

	return result.object;
};
