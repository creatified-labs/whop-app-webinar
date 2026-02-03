'use server';

/**
 * Settings Server Actions
 * Server-side actions for settings management
 */

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { whopsdk } from '@/lib/whop-sdk';
import {
  getCompanyByWhopId,
  updateCompany,
  getCompanyMember,
  updateMemberRole,
  removeCompanyMember,
  checkCompanyRole,
  syncCompanyMembership,
} from '@/lib/data/companies';
import { upsertEngagementConfig } from '@/lib/data/engagement';
import type { CompanyRole, CompanyUpdate, EngagementConfigUpdate } from '@/types/database';
import type { ApiResponse } from '@/types';

/**
 * Verify the current user has access to a company
 */
async function verifyCompanyAccess(
  whopCompanyId: string,
  requiredRole: CompanyRole = 'admin'
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
      email: null,
      name: user.name ?? null,
      username: user.username ?? null,
      profile_pic_url: user.profile_picture?.url ?? null,
    },
    'admin'
  );

  // Check role
  const hasRole = await checkCompanyRole(dbCompany.id, dbUser.id, requiredRole);
  if (!hasRole) {
    throw new Error('You do not have permission to perform this action');
  }

  return { companyId: dbCompany.id, userId: dbUser.id };
}

// ============================================
// Company Profile Actions
// ============================================

/**
 * Update company profile
 */
export async function updateCompanyProfile(
  whopCompanyId: string,
  updates: { name?: string; image_url?: string | null }
): Promise<ApiResponse<null>> {
  try {
    const { companyId } = await verifyCompanyAccess(whopCompanyId, 'admin');

    const companyUpdates: CompanyUpdate = {};
    if (updates.name !== undefined) {
      companyUpdates.name = updates.name;
    }
    if (updates.image_url !== undefined) {
      companyUpdates.image_url = updates.image_url;
    }

    await updateCompany(companyId, companyUpdates);

    revalidatePath(`/dashboard/${whopCompanyId}`);
    revalidatePath(`/dashboard/${whopCompanyId}/settings`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Team Member Actions
// ============================================

/**
 * Change a member's role
 */
export async function changeMemberRole(
  whopCompanyId: string,
  targetUserId: string,
  newRole: CompanyRole
): Promise<ApiResponse<null>> {
  try {
    const { companyId, userId } = await verifyCompanyAccess(whopCompanyId, 'owner');

    // Cannot change your own role
    if (targetUserId === userId) {
      throw new Error('You cannot change your own role');
    }

    // Get the target member
    const targetMember = await getCompanyMember(companyId, targetUserId);
    if (!targetMember) {
      throw new Error('Member not found');
    }

    // Cannot demote another owner (there should only be one owner)
    if (targetMember.role === 'owner') {
      throw new Error('Cannot change the role of the owner');
    }

    await updateMemberRole(companyId, targetUserId, newRole);

    revalidatePath(`/dashboard/${whopCompanyId}/settings`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change role';
    return { data: null, error: message, success: false };
  }
}

/**
 * Remove a member from the company
 */
export async function removeMember(
  whopCompanyId: string,
  targetUserId: string
): Promise<ApiResponse<null>> {
  try {
    const { companyId, userId } = await verifyCompanyAccess(whopCompanyId, 'owner');

    // Cannot remove yourself
    if (targetUserId === userId) {
      throw new Error('You cannot remove yourself');
    }

    // Get the target member
    const targetMember = await getCompanyMember(companyId, targetUserId);
    if (!targetMember) {
      throw new Error('Member not found');
    }

    // Cannot remove the owner
    if (targetMember.role === 'owner') {
      throw new Error('Cannot remove the owner');
    }

    await removeCompanyMember(companyId, targetUserId);

    revalidatePath(`/dashboard/${whopCompanyId}/settings`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Notification Settings Actions
// ============================================

export interface NotificationSettings {
  email_on_registration: boolean;
  email_on_webinar_start: boolean;
}

/**
 * Update notification settings
 * Note: This would typically be stored in a settings table or JSONB column
 * For now, we'll just validate and revalidate
 */
export async function updateNotificationSettings(
  whopCompanyId: string,
  settings: NotificationSettings
): Promise<ApiResponse<null>> {
  try {
    await verifyCompanyAccess(whopCompanyId, 'admin');

    // TODO: Store settings in database (would need settings table or JSONB column)
    // For now, just validate the action succeeds

    revalidatePath(`/dashboard/${whopCompanyId}/settings`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notification settings';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Default Webinar Settings Actions
// ============================================

export interface DefaultWebinarSettings {
  default_timezone: string;
  default_duration_minutes: number;
  chat_enabled: boolean;
  qa_enabled: boolean;
  polls_enabled: boolean;
  reactions_enabled: boolean;
}

/**
 * Update default webinar settings
 * Note: This would typically be stored in a settings table or JSONB column
 * For now, we'll just validate and revalidate
 */
export async function updateDefaultWebinarSettings(
  whopCompanyId: string,
  settings: DefaultWebinarSettings
): Promise<ApiResponse<null>> {
  try {
    await verifyCompanyAccess(whopCompanyId, 'admin');

    // TODO: Store settings in database (would need settings table or JSONB column)
    // For now, just validate the action succeeds

    revalidatePath(`/dashboard/${whopCompanyId}/settings`);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update webinar settings';
    return { data: null, error: message, success: false };
  }
}

// ============================================
// Engagement Config Actions
// ============================================

/**
 * Update engagement scoring configuration
 */
export async function updateEngagementConfig(
  companyId: string,
  config: EngagementConfigUpdate
): Promise<ApiResponse<null>> {
  try {
    await upsertEngagementConfig(companyId, config);

    return { data: null, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update engagement config';
    return { data: null, error: message, success: false };
  }
}
