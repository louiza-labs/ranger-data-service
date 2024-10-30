import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface Application {
	id: string;
	user_id: string;
	context: string;
	company: string;
	position?: string;
	status: string;
	created_at: string;
	updated_at: string;
	sender_email: string;
	receiver_email: string;
	email_thread?: ProcessedEmail[];
}

export async function createApplication(
	userId: string,
	context: string,
	company: string,
	position: string | null,
	status: string,
	senderEmail: string,
	receiverEmail: string
): Promise<{ success: boolean; data?: Application; error?: any }> {
	try {
		const companyDomain = company.toLowerCase().replace(/[^a-z0-9]/g, "");
		const contact = senderEmail.toLowerCase().includes(companyDomain) ? senderEmail : receiverEmail;

		const { data, error } = await supabase
			.from("applications")
			.insert({
				user_id: userId,
				context,
				company,
				position,
				status,
				contact,
			})
			.select()
			.single();

		if (error) throw error;

		return { success: true, data };
	} catch (error) {
		console.error("Error creating application:", error);
		return { success: false, error };
	}
}

export async function updateApplicationStatus(
	applicationId: string,
	newStatus: string
): Promise<{ success: boolean; data?: Application; error?: any }> {
	try {
		const { data, error } = await supabase
			.from("applications")
			.update({
				status: newStatus,
				updated_at: new Date().toISOString(),
			})
			.eq("id", applicationId)
			.select()
			.single();

		if (error) throw error;

		return { success: true, data };
	} catch (error) {
		console.error("Error updating application status:", error);
		return { success: false, error };
	}
}

export async function getApplications(
	userId: string,
	context?: string
): Promise<{ success: boolean; data?: Application[]; error?: any }> {
	try {
		// First get applications
		const { data: applications, error: fetchError } = await supabase
			.from("applications")
			.select("*")
			.eq("user_id", userId);

		if (fetchError) throw fetchError;

		// Then get associated email threads from processed_emails table
		const { data: emailThreads, error: emailError } = await supabase
			.from("processed_emails")
			.select("*")
			.eq("user_id", userId)
			.in(
				"application_id",
				applications.map((app) => app.id)
			);

		if (emailError) throw emailError;

		// Group emails by application_id
		const emailsByApplication = emailThreads.reduce((acc, email) => {
			if (!acc[email.application_id]) {
				acc[email.application_id] = [];
			}
			acc[email.application_id].push(email);
			return acc;
		}, {});

		// Attach email threads to applications
		const applicationsWithThreads = applications.map((application) => ({
			...application,
			email_thread: emailsByApplication[application.id] || [],
		}));

		return { success: true, data: applicationsWithThreads };
	} catch (error) {
		console.error("Error fetching applications:", error);
		return { success: false, error };
	}
}
