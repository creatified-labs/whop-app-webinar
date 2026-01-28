/**
 * Registration Data Functions
 * Manage webinar registrations
 */

import { createAdminClient } from '@/lib/supabase/server';
import type {
  Registration,
  RegistrationInsert,
  RegistrationUpdate,
} from '@/types/database';
import type { RegistrationWithWebinar, RegistrationWithUser } from '@/types';

// ============================================
// Registration CRUD
// ============================================

/**
 * Create a new registration
 */
export async function createRegistration(
  webinarId: string,
  data: Omit<RegistrationInsert, 'webinar_id'>
): Promise<Registration> {
  const supabase = createAdminClient();

  const registrationData: RegistrationInsert = {
    ...data,
    webinar_id: webinarId,
  };

  const { data: registration, error } = await supabase
    .from('registrations')
    .insert(registrationData)
    .select()
    .single();

  if (error) {
    // Check if it's a unique constraint violation (already registered)
    if (error.code === '23505') {
      throw new Error('You are already registered for this webinar');
    }
    throw new Error(`Failed to create registration: ${error.message}`);
  }

  return registration;
}

/**
 * Get a registration by ID
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get registration: ${error.message}`);
  }

  return data;
}

/**
 * Get a registration by webinar and email
 */
export async function getRegistrationByEmail(
  webinarId: string,
  email: string
): Promise<Registration | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('email', email.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get registration: ${error.message}`);
  }

  return data;
}

/**
 * Get a registration with webinar details
 */
export async function getRegistrationWithWebinar(
  id: string
): Promise<RegistrationWithWebinar | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      webinar:webinars(*)
    `)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get registration: ${error.message}`);
  }

  return data as RegistrationWithWebinar | null;
}

/**
 * Update a registration
 */
export async function updateRegistration(
  id: string,
  updates: RegistrationUpdate
): Promise<Registration> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update registration: ${error.message}`);
  }

  return data;
}

/**
 * Delete a registration
 */
export async function deleteRegistration(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete registration: ${error.message}`);
  }
}

// ============================================
// Registration Queries
// ============================================

/**
 * Get all registrations for a webinar
 */
export async function getWebinarRegistrations(
  webinarId: string,
  options?: {
    limit?: number;
    offset?: number;
    attended?: boolean;
  }
): Promise<{ registrations: RegistrationWithUser[]; total: number }> {
  const supabase = createAdminClient();

  let query = supabase
    .from('registrations')
    .select(`
      *,
      user:users(name, profile_pic_url)
    `, { count: 'exact' })
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: false });

  if (options?.attended !== undefined) {
    query = query.eq('attended', options.attended);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get registrations: ${error.message}`);
  }

  return {
    registrations: data as RegistrationWithUser[],
    total: count ?? 0,
  };
}

/**
 * Get registration count for a webinar
 */
export async function getRegistrationCount(webinarId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to get registration count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get attendee count for a webinar
 */
export async function getAttendeeCount(webinarId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('webinar_id', webinarId)
    .eq('attended', true);

  if (error) {
    throw new Error(`Failed to get attendee count: ${error.message}`);
  }

  return count ?? 0;
}

// ============================================
// Attendance Tracking
// ============================================

/**
 * Mark a registration as attended
 */
export async function markAttended(registrationId: string): Promise<Registration> {
  return updateRegistration(registrationId, {
    attended: true,
    attended_at: new Date().toISOString(),
  });
}

/**
 * Mark a registration as having watched replay
 */
export async function markWatchedReplay(registrationId: string): Promise<Registration> {
  return updateRegistration(registrationId, {
    watched_replay: true,
    watched_replay_at: new Date().toISOString(),
  });
}

// ============================================
// Email Status Updates
// ============================================

/**
 * Mark confirmation email as sent
 */
export async function markConfirmationSent(registrationId: string): Promise<void> {
  await updateRegistration(registrationId, { confirmation_sent: true });
}

/**
 * Mark 24-hour reminder as sent
 */
export async function markReminder24hSent(registrationId: string): Promise<void> {
  await updateRegistration(registrationId, { reminder_24h_sent: true });
}

/**
 * Mark 1-hour reminder as sent
 */
export async function markReminder1hSent(registrationId: string): Promise<void> {
  await updateRegistration(registrationId, { reminder_1h_sent: true });
}

/**
 * Mark replay email as sent
 */
export async function markReplaySent(registrationId: string): Promise<void> {
  await updateRegistration(registrationId, { replay_sent: true });
}

// ============================================
// Registration Search
// ============================================

/**
 * Search registrations by email or name
 */
export async function searchRegistrations(
  webinarId: string,
  query: string
): Promise<Registration[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to search registrations: ${error.message}`);
  }

  return data;
}

/**
 * Get registrations pending email (for cron job)
 */
export async function getRegistrationsPendingEmail(
  webinarId: string,
  emailType: 'confirmation' | 'reminder_1h' | 'reminder_24h' | 'replay'
): Promise<Registration[]> {
  const supabase = createAdminClient();

  const sentColumn = {
    confirmation: 'confirmation_sent',
    reminder_1h: 'reminder_1h_sent',
    reminder_24h: 'reminder_24h_sent',
    replay: 'replay_sent',
  }[emailType];

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq(sentColumn, false);

  if (error) {
    throw new Error(`Failed to get registrations pending email: ${error.message}`);
  }

  return data;
}

/**
 * Get all registrations for a user by their email
 */
export async function getRegistrationsByEmail(email: string): Promise<RegistrationWithWebinar[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      webinar:webinars(*)
    `)
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get registrations: ${error.message}`);
  }

  return data as RegistrationWithWebinar[];
}

/**
 * Export registrations for a webinar (for CSV export)
 */
export async function exportWebinarRegistrations(webinarId: string): Promise<Registration[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to export registrations: ${error.message}`);
  }

  return data;
}
