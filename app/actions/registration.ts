'use server';

/**
 * Registration Server Actions
 * Server-side actions for webinar registration
 */

import { revalidatePath } from 'next/cache';
import {
  createRegistration as createRegistrationData,
  getRegistrationByEmail,
  getRegistrationById,
  updateRegistration,
  deleteRegistration as deleteRegistrationData,
  markAttended,
  markWatchedReplay,
  getWebinarBySlug,
  getWebinarById,
  getWebinarHosts,
  getCompanyById,
} from '@/lib/data';
import { queueConfirmationEmail, queueReminderEmails, isEmailEnabled } from '@/lib/email';
import {
  registrationSchema,
  type RegistrationInput,
} from '@/lib/validations/webinar';
import type { Registration } from '@/types/database';
import type { ApiResponse } from '@/types';

// ============================================
// Public Registration Actions
// ============================================

/**
 * Register for a webinar (public action - no auth required)
 */
export async function registerForWebinar(
  slug: string,
  input: RegistrationInput
): Promise<ApiResponse<Registration>> {
  try {
    // Validate input
    const validatedData = registrationSchema.parse(input);

    // Get webinar by slug
    const webinar = await getWebinarBySlug(slug);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    // Check if webinar is open for registration
    if (!['scheduled', 'live'].includes(webinar.status)) {
      throw new Error('This webinar is not accepting registrations');
    }

    // Check if already registered
    const existingRegistration = await getRegistrationByEmail(
      webinar.id,
      validatedData.email.toLowerCase()
    );

    if (existingRegistration) {
      // Return existing registration instead of error
      return {
        data: existingRegistration,
        error: null,
        success: true,
      };
    }

    // Create registration
    const registration = await createRegistrationData(webinar.id, {
      email: validatedData.email.toLowerCase(),
      name: validatedData.name || null,
      user_id: null, // Public registration - no user linked
      source: validatedData.source || null,
      utm_campaign: validatedData.utm_campaign || null,
      utm_medium: validatedData.utm_medium || null,
      utm_content: validatedData.utm_content || null,
    });

    // Queue confirmation and reminder emails
    if (isEmailEnabled() && webinar.send_confirmation_email) {
      try {
        // Get host and company info for email
        const [hosts, company] = await Promise.all([
          getWebinarHosts(webinar.id),
          getCompanyById(webinar.company_id),
        ]);
        const hostName = hosts[0]?.name;
        const companyName = company?.name;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const watchUrl = `${baseUrl}/webinar/${slug}/watch?email=${encodeURIComponent(registration.email)}`;

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
      } catch (emailError) {
        // Log but don't fail registration if email fails
        console.error('Failed to queue emails:', emailError);
      }
    }

    revalidatePath(`/webinar/${slug}`);

    return { data: registration, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register';
    return { data: null, error: message, success: false };
  }
}

/**
 * Verify a registration exists (for watch page access)
 */
export async function verifyRegistration(
  slug: string,
  email: string
): Promise<ApiResponse<Registration>> {
  try {
    // Get webinar by slug
    const webinar = await getWebinarBySlug(slug);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    // Get registration
    const registration = await getRegistrationByEmail(webinar.id, email.toLowerCase());

    if (!registration) {
      throw new Error('Registration not found. Please register first.');
    }

    return { data: registration, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify registration';
    return { data: null, error: message, success: false };
  }
}

/**
 * Track attendance when viewer joins
 */
export async function trackAttendance(registrationId: string): Promise<ApiResponse<Registration>> {
  try {
    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Only mark attended if not already attended
    if (registration.attended) {
      return { data: registration, error: null, success: true };
    }

    const updated = await markAttended(registrationId);
    return { data: updated, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track attendance';
    return { data: null, error: message, success: false };
  }
}

/**
 * Track replay view
 */
export async function trackReplayView(registrationId: string): Promise<ApiResponse<Registration>> {
  try {
    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Only mark if not already watched
    if (registration.watched_replay) {
      return { data: registration, error: null, success: true };
    }

    const updated = await markWatchedReplay(registrationId);
    return { data: updated, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track replay view';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Admin Registration Actions (require auth)
// ============================================

import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { checkCompanyRole, getOrCreateUser } from '@/lib/data';

/**
 * Verify admin access to a webinar's registrations
 */
async function verifyAdminAccess(webinarId: string): Promise<void> {
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    throw new Error('Webinar not found');
  }

  const headersList = await headers();
  const { userId: whopUserId } = await whopsdk.verifyUserToken(headersList);

  const user = await whopsdk.users.retrieve(whopUserId);
  const dbUser = await getOrCreateUser({
    id: user.id,
    email: null,
    name: user.name ?? null,
    username: user.username ?? null,
    profile_pic_url: user.profile_picture?.url ?? null,
  });

  const hasRole = await checkCompanyRole(webinar.company_id, dbUser.id, 'admin');
  if (!hasRole) {
    throw new Error('You do not have permission to manage registrations');
  }
}

/**
 * Delete a registration (admin only)
 */
export async function deleteRegistration(
  webinarId: string,
  registrationId: string
): Promise<ApiResponse<null>> {
  try {
    await verifyAdminAccess(webinarId);

    await deleteRegistrationData(registrationId);

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}/registrations`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete registration';
    return { data: null, error: message, success: false };
  }
}

/**
 * Update a registration (admin only)
 */
export async function adminUpdateRegistration(
  webinarId: string,
  registrationId: string,
  data: { name?: string; attended?: boolean }
): Promise<ApiResponse<Registration>> {
  try {
    await verifyAdminAccess(webinarId);

    const updated = await updateRegistration(registrationId, data);

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}/registrations`);

    return { data: updated, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update registration';
    return { data: null, error: message, success: false };
  }
}

/**
 * Manually add a registration (admin only)
 */
export async function addManualRegistration(
  webinarId: string,
  input: RegistrationInput
): Promise<ApiResponse<Registration>> {
  try {
    await verifyAdminAccess(webinarId);

    // Validate input
    const validatedData = registrationSchema.parse(input);

    // Check if already registered
    const existingRegistration = await getRegistrationByEmail(
      webinarId,
      validatedData.email.toLowerCase()
    );

    if (existingRegistration) {
      throw new Error('This email is already registered');
    }

    // Create registration
    const registration = await createRegistrationData(webinarId, {
      email: validatedData.email.toLowerCase(),
      name: validatedData.name || null,
      user_id: null,
      source: 'manual',
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}/registrations`);

    return { data: registration, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add registration';
    return { data: null, error: message, success: false };
  }
}

/**
 * Export registrations as CSV data (admin only)
 */
export async function exportRegistrations(webinarId: string): Promise<ApiResponse<string>> {
  try {
    await verifyAdminAccess(webinarId);

    const { exportWebinarRegistrations } = await import('@/lib/data/registrations');
    const registrations = await exportWebinarRegistrations(webinarId);

    // Build CSV
    const headers = [
      'Email',
      'Name',
      'Registered At',
      'Attended',
      'Attended At',
      'Watched Replay',
      'Source',
      'UTM Campaign',
      'UTM Medium',
      'UTM Content',
    ];

    const rows = registrations.map((r) => [
      r.email,
      r.name || '',
      r.created_at,
      r.attended ? 'Yes' : 'No',
      r.attended_at || '',
      r.watched_replay ? 'Yes' : 'No',
      r.source || '',
      r.utm_campaign || '',
      r.utm_medium || '',
      r.utm_content || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return { data: csv, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export registrations';
    return { data: null, error: message, success: false };
  }
}
