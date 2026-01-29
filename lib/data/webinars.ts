/**
 * Webinar Data Functions
 * CRUD operations for webinars
 */

import { createAdminClient } from '@/lib/supabase/server';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { hasWebinarStarted, hasWebinarEnded } from '@/lib/utils/date';
import type {
  Webinar,
  WebinarInsert,
  WebinarUpdate,
  WebinarHost,
  WebinarHostInsert,
  WebinarHostUpdate,
  WebinarStatus,
} from '@/types/database';
import type { WebinarWithHosts, WebinarWithDetails, WebinarPublicView } from '@/types';

// ============================================
// Real-time Status Management
// ============================================

/**
 * Check and update webinar status based on current time
 * Called on page load instead of using cron jobs
 * Returns the updated status if changed, or current status
 */
export async function checkAndUpdateWebinarStatus(
  webinar: { id: string; status: WebinarStatus; scheduled_at: string; duration_minutes: number }
): Promise<WebinarStatus> {
  const { id, status, scheduled_at, duration_minutes } = webinar;

  // Only check scheduled or live webinars
  if (status !== 'scheduled' && status !== 'live') {
    return status;
  }

  const shouldBeLive = status === 'scheduled' && hasWebinarStarted(scheduled_at);
  const shouldBeEnded = status === 'live' && hasWebinarEnded(scheduled_at, duration_minutes);

  if (shouldBeLive) {
    await updateWebinarStatus(id, 'live');
    return 'live';
  }

  if (shouldBeEnded) {
    await updateWebinarStatus(id, 'ended');
    // Queue replay emails in the background (fire and forget)
    queueReplayEmailsOnEnd(id).catch(console.error);
    return 'ended';
  }

  return status;
}

/**
 * Queue replay emails when webinar ends
 * This runs in the background when status transitions to 'ended'
 */
async function queueReplayEmailsOnEnd(webinarId: string): Promise<void> {
  const supabase = createAdminClient();

  // Get webinar details
  const { data: webinar } = await supabase
    .from('webinars')
    .select('id, title, replay_url, cta_text, cta_url, send_replay_email')
    .eq('id', webinarId)
    .single();

  if (!webinar?.send_replay_email || !webinar.replay_url) {
    return;
  }

  // Get registrations that haven't received replay email
  const { data: registrations } = await supabase
    .from('registrations')
    .select('id, email, name, attended')
    .eq('webinar_id', webinarId)
    .eq('replay_sent', false);

  if (!registrations?.length) {
    return;
  }

  // Get host name
  const { data: hosts } = await supabase
    .from('webinar_hosts')
    .select('name')
    .eq('webinar_id', webinarId)
    .order('display_order', { ascending: true })
    .limit(1);

  const hostName = hosts?.[0]?.name;

  // Import email function dynamically to avoid circular deps
  const { queueReplayEmail } = await import('@/lib/email');

  // Queue emails for each registration
  for (const registration of registrations) {
    await queueReplayEmail({
      registrationId: registration.id,
      email: registration.email,
      name: registration.name,
      webinarTitle: webinar.title,
      replayUrl: webinar.replay_url,
      attended: registration.attended,
      hostName,
      ctaText: webinar.cta_text || undefined,
      ctaUrl: webinar.cta_url || undefined,
    });

    // Mark replay as sent
    await supabase
      .from('registrations')
      .update({ replay_sent: true })
      .eq('id', registration.id);
  }
}

// ============================================
// Webinar CRUD
// ============================================

/**
 * Create a new webinar
 */
export async function createWebinar(
  companyId: string,
  data: Omit<WebinarInsert, 'company_id' | 'slug'>
): Promise<Webinar> {
  const supabase = createAdminClient();

  const slug = generateUniqueSlug(data.title);

  const webinarData: WebinarInsert = {
    ...data,
    company_id: companyId,
    slug,
  };

  const { data: webinar, error } = await supabase
    .from('webinars')
    .insert(webinarData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create webinar: ${error.message}`);
  }

  return webinar;
}

/**
 * Get a webinar by ID
 * Includes real-time status check and update
 */
export async function getWebinarById(id: string): Promise<Webinar | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get webinar: ${error.message}`);
  }

  if (!data) return null;

  // Real-time status check and update
  const currentStatus = await checkAndUpdateWebinarStatus({
    id: data.id,
    status: data.status,
    scheduled_at: data.scheduled_at,
    duration_minutes: data.duration_minutes,
  });

  return { ...data, status: currentStatus };
}

/**
 * Get a webinar by slug (for public pages)
 */
export async function getWebinarBySlug(slug: string): Promise<Webinar | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get webinar: ${error.message}`);
  }

  return data;
}

/**
 * Get a webinar with hosts
 */
export async function getWebinarWithHosts(id: string): Promise<WebinarWithHosts | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinars')
    .select(`
      *,
      hosts:webinar_hosts(*)
    `)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get webinar: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...data,
    hosts: data.hosts.sort((a: WebinarHost, b: WebinarHost) => a.display_order - b.display_order),
  } as WebinarWithHosts;
}

/**
 * Get a webinar with full details (for dashboard)
 * Includes real-time status check and update
 */
export async function getWebinarWithDetails(id: string): Promise<WebinarWithDetails | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinars')
    .select(`
      *,
      hosts:webinar_hosts(*),
      company:companies(*),
      registrations:registrations(count)
    `)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get webinar: ${error.message}`);
  }

  if (!data) return null;

  // Real-time status check and update
  const currentStatus = await checkAndUpdateWebinarStatus({
    id: data.id,
    status: data.status,
    scheduled_at: data.scheduled_at,
    duration_minutes: data.duration_minutes,
  });

  return {
    ...data,
    status: currentStatus, // Use the updated status
    hosts: data.hosts.sort((a: WebinarHost, b: WebinarHost) => a.display_order - b.display_order),
    registration_count: data.registrations[0]?.count ?? 0,
  } as unknown as WebinarWithDetails;
}

/**
 * Get public webinar data (for landing pages)
 * Includes real-time status check and update
 */
export async function getWebinarPublicView(slug: string): Promise<WebinarPublicView | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinars')
    .select(`
      id,
      title,
      slug,
      description,
      scheduled_at,
      duration_minutes,
      timezone,
      status,
      cover_image_url,
      cta_text,
      cta_url,
      show_host_info,
      chat_enabled,
      qa_enabled,
      polls_enabled,
      reactions_enabled,
      registration_fields,
      hosts:webinar_hosts(id, name, title, bio, image_url, display_order),
      company:companies(name, image_url),
      registrations:registrations(count)
    `)
    .eq('slug', slug)
    .in('status', ['scheduled', 'live', 'ended'])
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get webinar: ${error.message}`);
  }

  if (!data) return null;

  // Real-time status check and update
  const currentStatus = await checkAndUpdateWebinarStatus({
    id: data.id,
    status: data.status,
    scheduled_at: data.scheduled_at,
    duration_minutes: data.duration_minutes,
  });

  return {
    ...data,
    status: currentStatus, // Use the updated status
    hosts: data.hosts.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order),
    company: data.company,
    registration_count: data.registrations[0]?.count ?? 0,
  } as unknown as WebinarPublicView;
}

/**
 * Update a webinar
 */
export async function updateWebinar(id: string, updates: WebinarUpdate): Promise<Webinar> {
  const supabase = createAdminClient();

  // If title changed, update slug
  if (updates.title) {
    updates.slug = generateUniqueSlug(updates.title);
  }

  const { data, error } = await supabase
    .from('webinars')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update webinar: ${error.message}`);
  }

  return data;
}

/**
 * Update webinar status
 */
export async function updateWebinarStatus(id: string, status: WebinarStatus): Promise<Webinar> {
  return updateWebinar(id, { status });
}

/**
 * Delete a webinar
 */
export async function deleteWebinar(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('webinars')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete webinar: ${error.message}`);
  }
}

/**
 * Get all webinars for a company
 * Includes real-time status check and update for each webinar
 */
export async function getCompanyWebinars(
  companyId: string,
  options?: {
    status?: WebinarStatus | WebinarStatus[];
    search?: string;
    limit?: number;
    offset?: number;
    skipStatusCheck?: boolean; // Skip status check for performance when not needed
  }
): Promise<{ webinars: WebinarWithHosts[]; total: number }> {
  const supabase = createAdminClient();

  let query = supabase
    .from('webinars')
    .select(`
      *,
      hosts:webinar_hosts(*)
    `, { count: 'exact' })
    .eq('company_id', companyId)
    .order('scheduled_at', { ascending: false });

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    query = query.in('status', statuses);
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get company webinars: ${error.message}`);
  }

  // Real-time status check for each webinar (unless skipped)
  const webinars = await Promise.all(
    data.map(async (webinar) => {
      let currentStatus = webinar.status;

      if (!options?.skipStatusCheck) {
        currentStatus = await checkAndUpdateWebinarStatus({
          id: webinar.id,
          status: webinar.status,
          scheduled_at: webinar.scheduled_at,
          duration_minutes: webinar.duration_minutes,
        });
      }

      return {
        ...webinar,
        status: currentStatus,
        hosts: webinar.hosts.sort((a: WebinarHost, b: WebinarHost) => a.display_order - b.display_order),
      };
    })
  ) as WebinarWithHosts[];

  return { webinars, total: count ?? 0 };
}

/**
 * Get upcoming webinars (for email reminders, status updates)
 */
export async function getUpcomingWebinars(
  withinMinutes: number
): Promise<Webinar[]> {
  const supabase = createAdminClient();

  const now = new Date();
  const future = new Date(now.getTime() + withinMinutes * 60 * 1000);

  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', future.toISOString());

  if (error) {
    throw new Error(`Failed to get upcoming webinars: ${error.message}`);
  }

  return data;
}

/**
 * Get webinars that should be marked as ended
 */
export async function getWebinarsToEnd(): Promise<Webinar[]> {
  const supabase = createAdminClient();

  // Get all live webinars
  const { data, error } = await supabase
    .from('webinars')
    .select('*')
    .eq('status', 'live');

  if (error) {
    throw new Error(`Failed to get webinars to end: ${error.message}`);
  }

  // Filter to those that should have ended
  const now = new Date();
  return data.filter((webinar) => {
    const endTime = new Date(
      new Date(webinar.scheduled_at).getTime() + webinar.duration_minutes * 60 * 1000
    );
    return now > endTime;
  });
}

// ============================================
// Webinar Host Functions
// ============================================

/**
 * Add a host to a webinar
 */
export async function addWebinarHost(
  webinarId: string,
  hostData: Omit<WebinarHostInsert, 'webinar_id'>
): Promise<WebinarHost> {
  const supabase = createAdminClient();

  // Get current max display order
  const { data: existingHosts } = await supabase
    .from('webinar_hosts')
    .select('display_order')
    .eq('webinar_id', webinarId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existingHosts?.[0]?.display_order ?? -1;

  const { data, error } = await supabase
    .from('webinar_hosts')
    .insert({
      ...hostData,
      webinar_id: webinarId,
      display_order: hostData.display_order ?? nextOrder + 1,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add webinar host: ${error.message}`);
  }

  return data;
}

/**
 * Update a webinar host
 */
export async function updateWebinarHost(
  hostId: string,
  updates: WebinarHostUpdate
): Promise<WebinarHost> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinar_hosts')
    .update(updates)
    .eq('id', hostId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update webinar host: ${error.message}`);
  }

  return data;
}

/**
 * Remove a host from a webinar
 */
export async function removeWebinarHost(hostId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('webinar_hosts')
    .delete()
    .eq('id', hostId);

  if (error) {
    throw new Error(`Failed to remove webinar host: ${error.message}`);
  }
}

/**
 * Get all hosts for a webinar
 */
export async function getWebinarHosts(webinarId: string): Promise<WebinarHost[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('webinar_hosts')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to get webinar hosts: ${error.message}`);
  }

  return data;
}

/**
 * Reorder webinar hosts
 */
export async function reorderWebinarHosts(
  webinarId: string,
  hostIds: string[]
): Promise<void> {
  const supabase = createAdminClient();

  // Update each host's display order
  const updates = hostIds.map((id, index) =>
    supabase
      .from('webinar_hosts')
      .update({ display_order: index })
      .eq('id', id)
      .eq('webinar_id', webinarId)
  );

  await Promise.all(updates);
}
