/**
 * Webinar Data Functions
 * CRUD operations for webinars
 */

import { createAdminClient } from '@/lib/supabase/server';
import { generateUniqueSlug } from '@/lib/utils/slug';
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

  return data;
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

  return {
    ...data,
    hosts: data.hosts.sort((a: WebinarHost, b: WebinarHost) => a.display_order - b.display_order),
    registration_count: data.registrations[0]?.count ?? 0,
  } as unknown as WebinarWithDetails;
}

/**
 * Get public webinar data (for landing pages)
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

  return {
    ...data,
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
 */
export async function getCompanyWebinars(
  companyId: string,
  options?: {
    status?: WebinarStatus | WebinarStatus[];
    search?: string;
    limit?: number;
    offset?: number;
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

  const webinars = data.map((webinar) => ({
    ...webinar,
    hosts: webinar.hosts.sort((a: WebinarHost, b: WebinarHost) => a.display_order - b.display_order),
  })) as WebinarWithHosts[];

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
