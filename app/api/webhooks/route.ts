import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { markPaymentCompleted, markPaymentRefunded, getRegistrationByWhopPaymentId } from "@/lib/data/payments";
import { getRegistrationById } from "@/lib/data/registrations";
import { extractRegistrationId } from "@/lib/whop/checkout";
import { queueConfirmationEmail, queueReminderEmails, isEmailEnabled } from "@/lib/email";
import { getWebinarById, getWebinarHosts } from "@/lib/data/webinars";
import { getCompanyById } from "@/lib/data/companies";

// Extended payment type to handle metadata
interface PaymentData {
	id: string;
	membership?: { id?: string } | null;
	metadata?: Record<string, unknown>;
	[key: string]: unknown;
}

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const requestBodyText = await request.text();
	const headers = Object.fromEntries(request.headers);
	const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

	// Handle the webhook event
	if (webhookData.type === "payment.succeeded") {
		waitUntil(handlePaymentSucceeded(webhookData.data as unknown as PaymentData));
	}
	// Note: payment.refunded may not be a standard Whop webhook event
	// Uncomment if your Whop plan supports it:
	// else if ((webhookData.type as string) === "payment.refunded") {
	// 	waitUntil(handlePaymentRefunded(webhookData.data as PaymentData));
	// }

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

/**
 * Handle successful payment
 * Updates registration status and sends confirmation emails
 */
async function handlePaymentSucceeded(payment: PaymentData) {
	console.log("[PAYMENT SUCCEEDED]", payment.id);

	try {
		// Extract registration ID from payment metadata
		const metadata = payment.metadata;
		const registrationId = extractRegistrationId(metadata);

		if (!registrationId) {
			console.log("[PAYMENT] No registration_id in metadata, skipping", payment.id);
			return;
		}

		// Get the registration
		const registration = await getRegistrationById(registrationId);
		if (!registration) {
			console.error("[PAYMENT] Registration not found:", registrationId);
			return;
		}

		// Skip if already completed
		if (registration.payment_status === 'completed') {
			console.log("[PAYMENT] Registration already completed:", registrationId);
			return;
		}

		// Get membership ID if available
		const membershipId = payment.membership?.id;

		// Mark payment as completed
		await markPaymentCompleted(
			registrationId,
			payment.id,
			membershipId || undefined
		);

		console.log("[PAYMENT] Marked registration as paid:", registrationId);

		// Queue confirmation emails now that payment is complete
		if (isEmailEnabled()) {
			try {
				const webinar = await getWebinarById(registration.webinar_id);
				if (!webinar) {
					console.error("[PAYMENT] Webinar not found:", registration.webinar_id);
					return;
				}

				if (webinar.send_confirmation_email) {
					const [hosts, company] = await Promise.all([
						getWebinarHosts(webinar.id),
						getCompanyById(webinar.company_id),
					]);
					const hostName = hosts[0]?.name;
					const companyName = company?.name;

					const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
					const watchUrl = `${baseUrl}/webinar/${webinar.slug}/watch?email=${encodeURIComponent(registration.email)}`;

					// Queue confirmation email
					await queueConfirmationEmail({
						registrationId: registration.id,
						email: registration.email,
						name: registration.name,
						webinarTitle: webinar.title,
						scheduledAt: new Date(webinar.scheduled_at),
						timezone: webinar.timezone,
						watchUrl,
						hostName,
						companyName,
					});

					// Queue reminder emails
					await queueReminderEmails({
						registrationId: registration.id,
						email: registration.email,
						name: registration.name,
						webinarTitle: webinar.title,
						scheduledAt: new Date(webinar.scheduled_at),
						timezone: webinar.timezone,
						watchUrl,
						hostName,
						send24h: webinar.send_reminder_24h,
						send1h: webinar.send_reminder_1h,
					});

					console.log("[PAYMENT] Queued emails for:", registration.email);
				}
			} catch (emailError) {
				console.error("[PAYMENT] Failed to queue emails:", emailError);
			}
		}
	} catch (error) {
		console.error("[PAYMENT] Error handling payment.succeeded:", error);
	}
}

/**
 * Handle payment refund (if supported by Whop)
 * Updates registration status to refunded
 */
async function handlePaymentRefunded(payment: PaymentData) {
	console.log("[PAYMENT REFUNDED]", payment.id);

	try {
		// Try to find registration by payment ID
		const registration = await getRegistrationByWhopPaymentId(payment.id);

		if (!registration) {
			// Also try metadata
			const metadata = payment.metadata;
			const registrationId = extractRegistrationId(metadata);

			if (!registrationId) {
				console.log("[REFUND] No registration found for payment:", payment.id);
				return;
			}

			const regFromId = await getRegistrationById(registrationId);
			if (!regFromId) {
				console.error("[REFUND] Registration not found:", registrationId);
				return;
			}

			await markPaymentRefunded(regFromId.id);
			console.log("[REFUND] Marked registration as refunded:", regFromId.id);
			return;
		}

		await markPaymentRefunded(registration.id);
		console.log("[REFUND] Marked registration as refunded:", registration.id);
	} catch (error) {
		console.error("[REFUND] Error handling payment.refunded:", error);
	}
}
