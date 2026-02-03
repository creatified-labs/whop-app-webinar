/**
 * Watch Time Data Functions
 * Track watch sessions and milestones
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { WatchSession, WatchSessionUpdate } from '@/types/database';
import { trackEngagementEvent } from './engagement';

// ============================================
// Watch Session Management
// ============================================

/**
 * Start a new watch session
 */
export async function startWatchSession(
  webinarId: string,
  registrationId: string
): Promise<WatchSession> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .insert({
      webinar_id: webinarId,
      registration_id: registrationId,
      session_start: new Date().toISOString(),
      total_watch_seconds: 0,
      milestones_reached: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start watch session: ${error.message}`);
  }

  return data;
}

/**
 * Update watch session progress
 */
export async function updateWatchSession(
  sessionId: string,
  update: WatchSessionUpdate
): Promise<WatchSession> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .update(update)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update watch session: ${error.message}`);
  }

  return data;
}

/**
 * Update watch progress and check for milestones
 * Returns newly reached milestones (if any)
 */
export async function updateWatchProgress(
  sessionId: string,
  currentSeconds: number,
  totalDurationSeconds: number
): Promise<{ session: WatchSession; newMilestones: number[] }> {
  const supabase = createAdminClient();

  // Get current session
  const { data: session, error: fetchError } = await supabase
    .from('watch_sessions')
    .select('*, webinar_id, registration_id')
    .eq('id', sessionId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to get watch session: ${fetchError.message}`);
  }

  // Calculate current percentage
  const currentPercentage = totalDurationSeconds > 0
    ? Math.floor((currentSeconds / totalDurationSeconds) * 100)
    : 0;

  // Determine which milestones have been reached
  const MILESTONES = [25, 50, 75, 100];
  const currentMilestones = session.milestones_reached || [];
  const newMilestones: number[] = [];

  for (const milestone of MILESTONES) {
    if (currentPercentage >= milestone && !currentMilestones.includes(milestone)) {
      newMilestones.push(milestone);
    }
  }

  // Update session with new progress
  const updatedMilestones = [...new Set([...currentMilestones, ...newMilestones])].sort((a, b) => a - b);

  const { data: updatedSession, error: updateError } = await supabase
    .from('watch_sessions')
    .update({
      total_watch_seconds: currentSeconds,
      milestones_reached: updatedMilestones,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update watch progress: ${updateError.message}`);
  }

  // Track engagement events for new milestones
  for (const milestone of newMilestones) {
    await trackEngagementEvent(
      session.webinar_id,
      session.registration_id,
      'watch_milestone',
      { milestone }
    );
  }

  return {
    session: updatedSession,
    newMilestones,
  };
}

/**
 * End a watch session
 */
export async function endWatchSession(sessionId: string): Promise<WatchSession> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .update({
      session_end: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to end watch session: ${error.message}`);
  }

  return data;
}

/**
 * Get active watch session for a registration (if any)
 */
export async function getActiveWatchSession(
  webinarId: string,
  registrationId: string
): Promise<WatchSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('registration_id', registrationId)
    .is('session_end', null)
    .order('session_start', { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get active session: ${error.message}`);
  }

  return data;
}

/**
 * Get or create active watch session
 */
export async function getOrCreateWatchSession(
  webinarId: string,
  registrationId: string
): Promise<WatchSession> {
  const existing = await getActiveWatchSession(webinarId, registrationId);
  if (existing) {
    return existing;
  }
  return startWatchSession(webinarId, registrationId);
}

/**
 * Get all watch sessions for a registration
 */
export async function getRegistrationWatchSessions(
  registrationId: string
): Promise<WatchSession[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .select('*')
    .eq('registration_id', registrationId)
    .order('session_start', { ascending: false });

  if (error) {
    throw new Error(`Failed to get watch sessions: ${error.message}`);
  }

  return data;
}

/**
 * Get total watch time for a registration
 */
export async function getRegistrationTotalWatchTime(
  registrationId: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .select('total_watch_seconds')
    .eq('registration_id', registrationId);

  if (error) {
    throw new Error(`Failed to get watch time: ${error.message}`);
  }

  return data.reduce((sum, session) => sum + (session.total_watch_seconds || 0), 0);
}

/**
 * Get highest milestone reached by a registration
 */
export async function getRegistrationHighestMilestone(
  registrationId: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('watch_sessions')
    .select('milestones_reached')
    .eq('registration_id', registrationId);

  if (error) {
    throw new Error(`Failed to get milestones: ${error.message}`);
  }

  let highest = 0;
  data.forEach((session) => {
    const milestones = session.milestones_reached || [];
    const sessionHighest = Math.max(...milestones, 0);
    if (sessionHighest > highest) {
      highest = sessionHighest;
    }
  });

  return highest;
}

// ============================================
// Webinar Watch Time Stats
// ============================================

export interface WebinarWatchTimeStats {
  totalSessions: number;
  uniqueViewers: number;
  avgWatchSeconds: number;
  milestoneBreakdown: Record<number, number>; // milestone -> count of viewers who reached it
  completionRate: number; // % who reached 100%
}

/**
 * Get watch time stats for a webinar
 */
export async function getWebinarWatchTimeStats(
  webinarId: string
): Promise<WebinarWatchTimeStats> {
  const supabase = createAdminClient();

  const { data: sessions, error } = await supabase
    .from('watch_sessions')
    .select('registration_id, total_watch_seconds, milestones_reached')
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to get watch time stats: ${error.message}`);
  }

  const uniqueViewers = new Set(sessions.map((s) => s.registration_id)).size;
  const totalWatchSeconds = sessions.reduce((sum, s) => sum + (s.total_watch_seconds || 0), 0);

  // Aggregate milestones per viewer (take highest per viewer)
  const viewerMilestones = new Map<string, number[]>();
  sessions.forEach((session) => {
    const current = viewerMilestones.get(session.registration_id) || [];
    const combined = [...new Set([...current, ...(session.milestones_reached || [])])];
    viewerMilestones.set(session.registration_id, combined);
  });

  const milestoneBreakdown: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
  let completedViewers = 0;

  viewerMilestones.forEach((milestones) => {
    [25, 50, 75, 100].forEach((m) => {
      if (milestones.includes(m)) {
        milestoneBreakdown[m]++;
      }
    });
    if (milestones.includes(100)) {
      completedViewers++;
    }
  });

  return {
    totalSessions: sessions.length,
    uniqueViewers,
    avgWatchSeconds: uniqueViewers > 0 ? Math.round(totalWatchSeconds / uniqueViewers) : 0,
    milestoneBreakdown,
    completionRate: uniqueViewers > 0 ? Math.round((completedViewers / uniqueViewers) * 100) : 0,
  };
}
