import { createClient } from '@/lib/supabase/server';
import type { ZoomSession, ZoomSessionInsert, ZoomSessionUpdate } from '@/types/database';

/**
 * Create a new Zoom session (when user joins)
 */
export async function createZoomSession(
  data: ZoomSessionInsert
): Promise<ZoomSession> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('zoom_sessions')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Failed to create zoom session:', error);
    throw new Error('Failed to create zoom session');
  }

  return session;
}

/**
 * Update a Zoom session (when user leaves)
 */
export async function updateZoomSession(
  id: string,
  data: ZoomSessionUpdate
): Promise<ZoomSession> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('zoom_sessions')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update zoom session:', error);
    throw new Error('Failed to update zoom session');
  }

  return session;
}

/**
 * End a Zoom session and calculate duration
 */
export async function endZoomSession(id: string): Promise<ZoomSession> {
  const supabase = await createClient();

  // First get the session to calculate duration
  const { data: existingSession, error: fetchError } = await supabase
    .from('zoom_sessions')
    .select()
    .eq('id', id)
    .single();

  if (fetchError || !existingSession) {
    throw new Error('Session not found');
  }

  const leftAt = new Date().toISOString();
  const joinedAt = new Date(existingSession.joined_at);
  const durationSeconds = Math.floor(
    (new Date(leftAt).getTime() - joinedAt.getTime()) / 1000
  );

  const { data: session, error } = await supabase
    .from('zoom_sessions')
    .update({
      left_at: leftAt,
      duration_seconds: durationSeconds,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to end zoom session');
  }

  return session;
}

/**
 * Get active Zoom session for a registration
 */
export async function getActiveZoomSession(
  webinarId: string,
  registrationId: string
): Promise<ZoomSession | null> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('zoom_sessions')
    .select()
    .eq('webinar_id', webinarId)
    .eq('registration_id', registrationId)
    .is('left_at', null)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to get active zoom session:', error);
    return null;
  }

  return session;
}

/**
 * Get all Zoom sessions for a registration
 */
export async function getZoomSessionsForRegistration(
  registrationId: string
): Promise<ZoomSession[]> {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from('zoom_sessions')
    .select()
    .eq('registration_id', registrationId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Failed to get zoom sessions:', error);
    return [];
  }

  return sessions || [];
}

/**
 * Get total watch time from Zoom sessions for a registration
 */
export async function getTotalZoomWatchTime(
  registrationId: string
): Promise<number> {
  const sessions = await getZoomSessionsForRegistration(registrationId);

  return sessions.reduce((total, session) => {
    return total + (session.duration_seconds || 0);
  }, 0);
}

/**
 * Get Zoom session statistics for a webinar
 */
export async function getZoomSessionStats(webinarId: string): Promise<{
  totalSessions: number;
  uniqueAttendees: number;
  averageDurationSeconds: number;
  totalWatchTimeSeconds: number;
}> {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from('zoom_sessions')
    .select('registration_id, duration_seconds')
    .eq('webinar_id', webinarId);

  if (error || !sessions) {
    return {
      totalSessions: 0,
      uniqueAttendees: 0,
      averageDurationSeconds: 0,
      totalWatchTimeSeconds: 0,
    };
  }

  const uniqueRegistrations = new Set(sessions.map((s) => s.registration_id));
  const totalWatchTime = sessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0),
    0
  );
  const completedSessions = sessions.filter((s) => s.duration_seconds !== null);
  const averageDuration =
    completedSessions.length > 0
      ? totalWatchTime / completedSessions.length
      : 0;

  return {
    totalSessions: sessions.length,
    uniqueAttendees: uniqueRegistrations.size,
    averageDurationSeconds: Math.round(averageDuration),
    totalWatchTimeSeconds: totalWatchTime,
  };
}
