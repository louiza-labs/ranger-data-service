import { createClient } from "@supabase/supabase-js";
import { convertEmailIdToDecimal } from "../../../lib/emails/helpers";
import { determineCompanyName, determineJobRole, determineRecruitmentStatus } from "../../ai";
import { createApplicationWithEmail } from "../../applications";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function processAndStoreEmails(userId: string, emails: any[]) {
	console.log(`Processing ${emails.length} emails for user ${userId}`);
	let processedCount = 0;
	let errorCount = 0;

	// First get existing applications for this user
	const { data: existingApplications } = await supabase.from("applications").select("*").eq("user_id", userId);

	for (const email of emails) {
		try {
			const emailIdForDb = convertEmailIdToDecimal(email.id);

			// Check if email already processed
			const { data: existingEmail } = await supabase
				.from("processed_emails")
				.select("id")
				.eq("id", emailIdForDb)
				.single();

			if (existingEmail) {
				console.log(`Email ${email.id} already processed, skipping`);
				processedCount++;
				continue;
			}

			// Get company name
			const company = await determineCompanyName(email.subject, email.body, email.senderEmail, email.receiverEmail);

			if (!company?.companyName) {
				console.log(`No company name found for email: ${email.id}`);
				continue;
			}

			// Determine recruitment status
			const statusResult = await determineRecruitmentStatus(email.body, false);
			console.log(`Determined status for email ${email.id}:`, statusResult);

			// Use the determined status or fall back to 'applied'
			const status = statusResult.status || "applied";

			// Get job role if available
			const jobRole = await determineJobRole(email.subject + " " + email.body);

			// Determine the company contact (from company domain)
			const companyDomain = company.companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
			const contact = email.senderEmail.toLowerCase().includes(companyDomain) ? email.senderEmail : email.receiverEmail;

			// Find existing application with exact or fuzzy match
			let applicationId = existingApplications?.find((app) => {
				const appCompany = app.company?.toLowerCase().trim();
				const emailCompany = company.companyName.toLowerCase().trim();
				return appCompany === emailCompany;
			})?.id;

			// If no exact match found, try fuzzy matching
			if (!applicationId && existingApplications) {
				const fuzzyMatch = existingApplications.find((app) => {
					const appCompany = app.company?.toLowerCase().trim();
					const emailCompany = company.companyName.toLowerCase().trim();
					return appCompany.includes(emailCompany) || emailCompany.includes(appCompany);
				});
				if (fuzzyMatch) {
					applicationId = fuzzyMatch.id;
					console.log(`Found fuzzy match for company ${company.companyName} -> ${fuzzyMatch.company}`);
				}
			}

			// Create new application if none found
			if (!applicationId) {
				try {
					const result = await createApplicationWithEmail(
						userId,
						email,
						company,
						status,
						jobRole,
						contact,
						emailIdForDb
					);
					applicationId = result.data?.id;
					processedCount++;
					console.log(`Created new application ${applicationId} for company ${company.companyName}`);
				} catch (error) {
					console.error("Error creating application with email:", error);
					errorCount++;
					continue;
				}
			} else {
				// If application exists, just add the email
				const { error: emailError } = await supabase.from("processed_emails").insert({
					id: emailIdForDb,
					user_id: userId,
					application_id: applicationId,
					context: "jobs",
					created_at: new Date().toISOString(),
					email_subject: email.subject,
					email_body: email.body,
					email_sender_email: email.senderEmail,
					email_receiver_email: email.receiverEmail,
					date: email.date,
					company: company.companyName,
					thread_id: email.threadId,
				});

				if (emailError) {
					console.error("Error storing processed email:", emailError);
					errorCount++;
					continue;
				}
				processedCount++;
			}
		} catch (error) {
			console.error(`Error processing email ${email.id}:`, error);
			errorCount++;
		}
	}

	return { processedCount, errorCount };
}
