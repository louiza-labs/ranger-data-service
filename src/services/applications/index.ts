import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface ProcessedEmail {
	id: string;
	user_id: string;
	application_id: string;
	email_subject: string;
	email_body: string;
	email_sender_email: string;
	email_receiver_email: string;
	date: string;
	company: string;
	context: string;
	thread_id: string;
	created_at: string;
}

export interface Application {
	id: string;
	user_id: string;
	context: string;
	company: string;
	position?: string;
	status: string;
	created_at: string;
	updated_at: string;
	contact: string;
	email_thread?: ProcessedEmail[];
}

export async function createApplicationWithEmail(
	userId: string,
	email: {
		subject: string;
		body: string;
		senderEmail: string;
		receiverEmail: string;
		date: string;
		threadId: string;
	},
	company: { companyName: string },
	status: string,
	jobRole: { jobRole?: string },
	contact: string,
	emailIdForDb: string
): Promise<{ success: boolean; data?: Application; error?: any }> {
	try {
		const { data, error } = await supabase.rpc("create_application_with_email", {
			p_user_id: userId,
			p_context: "jobs",
			p_company: company.companyName,
			p_position: jobRole?.jobRole || null,
			p_status: status,
			p_contact: contact,
			p_email_id: emailIdForDb,
			p_email_subject: email.subject,
			p_email_body: email.body,
			p_email_sender: email.senderEmail,
			p_email_receiver: email.receiverEmail,
			p_email_date: email.date,
			p_thread_id: email.threadId,
		});

		if (error) throw error;
		return { success: true, data };
	} catch (error) {
		console.error("Error creating application with email:", error);
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
		// .eq("context", context || "jobs");

		if (fetchError) throw fetchError;

		if (!applications || applications.length === 0) {
			return { success: true, data: [] };
		}
		console.log("applications", applications);

		// Get associated email threads
		const { data: emailThreads, error: emailError } = await supabase
			.from("processed_emails")
			.select(
				`
				id,
				application_id,
				email_subject,
				email_body,
				email_sender_email,
				email_receiver_email,
				date,
				company,
				context,
				thread_id
			`
			)
			.eq("user_id", userId)
			.in(
				"application_id",
				applications.map((app) => app.id)
			)
			.order("date", { ascending: true }); // Order emails by date

		if (emailError) throw emailError;

		const threads = emailThreads || [];

		// Group emails by application_id
		const emailsByApplication = threads.reduce((acc, email) => {
			if (!acc[email.application_id]) {
				acc[email.application_id] = [];
			}
			acc[email.application_id].push({
				id: email.id,
				email_subject: email.email_subject,
				email_body: email.email_body,
				email_sender_email: email.email_sender_email,
				email_receiver_email: email.email_receiver_email,
				date: email.date,
				company: email.company,
				context: email.context,
				thread_id: email.thread_id,
				application_id: email.application_id,
				created_at: email.date,
				user_id: userId,
			});
			return acc;
		}, {} as Record<string, ProcessedEmail[]>);

		// Map applications to match interface
		const applicationsWithThreads = applications.map((application) => ({
			id: application.id,
			user_id: application.user_id,
			context: application.context || "jobs",
			company: application.company,
			position: application.position || undefined,
			status: application.status,
			created_at: application.created_at,
			updated_at: application.updated_at,
			contact: application.contact,
			email_thread: emailsByApplication[application.id] || [],
		}));

		return { success: true, data: applicationsWithThreads };
	} catch (error) {
		console.error("Error fetching applications:", error);
		return { success: false, error };
	}
}
