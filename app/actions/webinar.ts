'use server';

/**
 * Webinar Server Actions
 * Server-side actions for webinar management
 */

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { whopsdk } from '@/lib/whop-sdk';
import {
  createWebinar as createWebinarData,
  updateWebinar as updateWebinarData,
  deleteWebinar as deleteWebinarData,
  updateWebinarStatus,
  addWebinarHost as addHostData,
  updateWebinarHost as updateHostData,
  removeWebinarHost as removeHostData,
  reorderWebinarHosts,
  getWebinarById,
  syncCompanyMembership,
  getCompanyByWhopId,
  checkCompanyRole,
} from '@/lib/data';
import {
  createWebinarSchema,
  updateWebinarSchema,
  hostSchema,
  type CreateWebinarInput,
  type UpdateWebinarInput,
  type HostInput,
} from '@/lib/validations/webinar';
import type { Webinar, WebinarHost, WebinarStatus } from '@/types/database';
import type { ApiResponse } from '@/types';

/**
 * Verify the current user has access to a company
 * Returns the internal company ID
 */
async function verifyCompanyAccess(
  whopCompanyId: string,
  requiredRole: 'owner' | 'admin' | 'member' = 'admin'
): Promise<{ companyId: string; userId: string }> {
  const headersList = await headers();
  const { userId: whopUserId } = await whopsdk.verifyUserToken(headersList);

  // Get company and user data from Whop
  const [company, user] = await Promise.all([
    whopsdk.companies.retrieve(whopCompanyId),
    whopsdk.users.retrieve(whopUserId),
  ]);

  // Sync to our database
  const { company: dbCompany, user: dbUser } = await syncCompanyMembership(
    whopCompanyId,
    whopUserId,
    { id: company.id, title: company.title, image_url: company.logo?.url ?? null },
    {
      id: user.id,
      email: null, // Whop SDK doesn't expose email in user retrieve
      name: user.name ?? null,
      username: user.username ?? null,
      profile_pic_url: user.profile_picture?.url ?? null,
    },
    'admin' // Default to admin for app users
  );

  // Check role
  const hasRole = await checkCompanyRole(dbCompany.id, dbUser.id, requiredRole);
  if (!hasRole) {
    throw new Error('You do not have permission to perform this action');
  }

  return { companyId: dbCompany.id, userId: dbUser.id };
}

/**
 * Verify the current user owns a specific webinar
 */
async function verifyWebinarAccess(
  webinarId: string,
  requiredRole: 'owner' | 'admin' | 'member' = 'admin'
): Promise<{ webinar: Webinar; userId: string }> {
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    throw new Error('Webinar not found');
  }

  const headersList = await headers();
  const { userId: whopUserId } = await whopsdk.verifyUserToken(headersList);

  // Get user and verify access
  const { getOrCreateUser } = await import('@/lib/data/users');
  const user = await whopsdk.users.retrieve(whopUserId);
  const dbUser = await getOrCreateUser({
    id: user.id,
    email: null,
    name: user.name ?? null,
    username: user.username ?? null,
    profile_pic_url: user.profile_picture?.url ?? null,
  });

  const hasRole = await checkCompanyRole(webinar.company_id, dbUser.id, requiredRole);
  if (!hasRole) {
    throw new Error('You do not have permission to manage this webinar');
  }

  return { webinar, userId: dbUser.id };
}

// ============================================
// Webinar CRUD Actions
// ============================================

/**
 * Create a new webinar
 */
export async function createWebinar(
  whopCompanyId: string,
  input: CreateWebinarInput
): Promise<ApiResponse<Webinar>> {
  try {
    // Validate input
    const validatedData = createWebinarSchema.parse(input);

    // Verify access
    const { companyId } = await verifyCompanyAccess(whopCompanyId);

    // Create webinar
    const webinar = await createWebinarData(companyId, {
      ...validatedData,
      status: 'draft',
      video_url: validatedData.video_url || null,
      replay_url: validatedData.replay_url || null,
      cover_image_url: validatedData.cover_image_url || null,
      cta_text: validatedData.cta_text || null,
      cta_url: validatedData.cta_url || null,
      description: validatedData.description || null,
    });

    revalidatePath(`/dashboard/${whopCompanyId}`);

    return { data: webinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create webinar';
    return { data: null, error: message, success: false };
  }
}

/**
 * Update a webinar
 */
export async function updateWebinar(
  webinarId: string,
  input: UpdateWebinarInput
): Promise<ApiResponse<Webinar>> {
  try {
    // Validate input
    const validatedData = updateWebinarSchema.parse(input);

    // Verify access
    await verifyWebinarAccess(webinarId);

    // Update webinar
    const webinar = await updateWebinarData(webinarId, {
      ...validatedData,
      video_url: validatedData.video_url || null,
      replay_url: validatedData.replay_url || null,
      cover_image_url: validatedData.cover_image_url || null,
      cta_text: validatedData.cta_text || null,
      cta_url: validatedData.cta_url || null,
      description: validatedData.description || null,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return { data: webinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update webinar';
    return { data: null, error: message, success: false };
  }
}

/**
 * Delete a webinar
 */
export async function deleteWebinar(webinarId: string): Promise<ApiResponse<null>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarAccess(webinarId, 'owner');

    // Delete webinar
    await deleteWebinarData(webinarId);

    revalidatePath(`/dashboard/[companyId]`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete webinar';
    return { data: null, error: message, success: false };
  }
}

/**
 * Change webinar status
 */
export async function changeWebinarStatus(
  webinarId: string,
  status: WebinarStatus
): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    await verifyWebinarAccess(webinarId);

    // Update status
    const webinar = await updateWebinarStatus(webinarId, status);

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);
    revalidatePath(`/webinar/${webinar.slug}`);

    return { data: webinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update webinar status';
    return { data: null, error: message, success: false };
  }
}

/**
 * Publish a webinar (change from draft to scheduled)
 */
export async function publishWebinar(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarAccess(webinarId);

    // Can only publish drafts
    if (webinar.status !== 'draft') {
      throw new Error('Only draft webinars can be published');
    }

    // Validate required fields for publishing
    if (!webinar.video_url) {
      throw new Error('Please add a video URL before publishing');
    }

    return changeWebinarStatus(webinarId, 'scheduled');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish webinar';
    return { data: null, error: message, success: false };
  }
}

/**
 * Start a webinar (go live)
 */
export async function startWebinar(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarAccess(webinarId);

    // Can only start scheduled webinars
    if (webinar.status !== 'scheduled') {
      throw new Error('Only scheduled webinars can be started');
    }

    return changeWebinarStatus(webinarId, 'live');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start webinar';
    return { data: null, error: message, success: false };
  }
}

/**
 * End a webinar
 */
export async function endWebinar(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarAccess(webinarId);

    // Can only end live webinars
    if (webinar.status !== 'live') {
      throw new Error('Only live webinars can be ended');
    }

    return changeWebinarStatus(webinarId, 'ended');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end webinar';
    return { data: null, error: message, success: false };
  }
}

/**
 * Cancel a webinar
 */
export async function cancelWebinar(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarAccess(webinarId);

    // Can't cancel ended webinars
    if (webinar.status === 'ended') {
      throw new Error('Cannot cancel an ended webinar');
    }

    return changeWebinarStatus(webinarId, 'cancelled');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel webinar';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Host Management Actions
// ============================================

/**
 * Add a host to a webinar
 */
export async function addWebinarHost(
  webinarId: string,
  input: HostInput
): Promise<ApiResponse<WebinarHost>> {
  try {
    // Validate input
    const validatedData = hostSchema.parse(input);

    // Verify access
    await verifyWebinarAccess(webinarId);

    // Add host
    const host = await addHostData(webinarId, {
      name: validatedData.name,
      title: validatedData.title || null,
      bio: validatedData.bio || null,
      image_url: validatedData.image_url || null,
      user_id: validatedData.user_id || null,
      display_order: 0,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return { data: host, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add host';
    return { data: null, error: message, success: false };
  }
}

/**
 * Update a webinar host
 */
export async function updateWebinarHost(
  webinarId: string,
  hostId: string,
  input: Partial<HostInput>
): Promise<ApiResponse<WebinarHost>> {
  try {
    // Verify access
    await verifyWebinarAccess(webinarId);

    // Update host
    const host = await updateHostData(hostId, {
      name: input.name,
      title: input.title || null,
      bio: input.bio || null,
      image_url: input.image_url || null,
      user_id: input.user_id || null,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return { data: host, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update host';
    return { data: null, error: message, success: false };
  }
}

/**
 * Remove a host from a webinar
 */
export async function removeWebinarHost(
  webinarId: string,
  hostId: string
): Promise<ApiResponse<null>> {
  try {
    // Verify access
    await verifyWebinarAccess(webinarId);

    // Remove host
    await removeHostData(hostId);

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove host';
    return { data: null, error: message, success: false };
  }
}

/**
 * Reorder webinar hosts
 */
export async function reorderHosts(
  webinarId: string,
  hostIds: string[]
): Promise<ApiResponse<null>> {
  try {
    // Verify access
    await verifyWebinarAccess(webinarId);

    // Reorder hosts
    await reorderWebinarHosts(webinarId, hostIds);

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder hosts';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Duplicate Webinar
// ============================================

/**
 * Duplicate a webinar
 */
export async function duplicateWebinar(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarAccess(webinarId);

    // Get hosts
    const { getWebinarHosts } = await import('@/lib/data/webinars');
    const hosts = await getWebinarHosts(webinarId);

    // Create new webinar as draft
    const newWebinar = await createWebinarData(webinar.company_id, {
      title: `${webinar.title} (Copy)`,
      description: webinar.description,
      scheduled_at: webinar.scheduled_at,
      duration_minutes: webinar.duration_minutes,
      timezone: webinar.timezone,
      status: 'draft',
      video_type: webinar.video_type,
      video_url: webinar.video_url,
      replay_url: webinar.replay_url,
      cover_image_url: webinar.cover_image_url,
      cta_text: webinar.cta_text,
      cta_url: webinar.cta_url,
      show_host_info: webinar.show_host_info,
      chat_enabled: webinar.chat_enabled,
      qa_enabled: webinar.qa_enabled,
      polls_enabled: webinar.polls_enabled,
      reactions_enabled: webinar.reactions_enabled,
      send_confirmation_email: webinar.send_confirmation_email,
      send_reminder_1h: webinar.send_reminder_1h,
      send_reminder_24h: webinar.send_reminder_24h,
      send_replay_email: webinar.send_replay_email,
    });

    // Copy hosts
    for (const host of hosts) {
      await addHostData(newWebinar.id, {
        name: host.name,
        title: host.title,
        bio: host.bio,
        image_url: host.image_url,
        user_id: host.user_id,
        display_order: host.display_order,
      });
    }

    revalidatePath(`/dashboard/[companyId]`);

    return { data: newWebinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to duplicate webinar';
    return { data: null, error: message, success: false };
  }
}
