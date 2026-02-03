/**
 * Engagement Data Functions
 * Track engagement events and manage scoring configuration
 */

import { createAdminClient } from '@/lib/supabase/server';
import type {
  EngagementEvent,
  EngagementEventInsert,
  EngagementConfig,
  EngagementConfigUpdate,
  EngagementEventType,
} from '@/types/database';

// Default point values (used when no company config exists)
const DEFAULT_POINTS: Record<EngagementEventType, number> = {
  chat_message: 1,
  qa_submit: 3,
  qa_upvote: 1,
  poll_response: 2,
  reaction: 1,
  cta_click: 5,
  watch_milestone: 0, // Varies by milestone
};

const DEFAULT_MILESTONE_POINTS: Record<number, number> = {
  25: 5,
  50: 10,
  75: 15,
  100: 25,
};

// ============================================
// Engagement Event Tracking
// ============================================

/**
 * Track an engagement event
 */
export async function trackEngagementEvent(
  webinarId: string,
  registrationId: string,
  eventType: EngagementEventType,
  eventData?: Record<string, unknown>
): Promise<EngagementEvent> {
  const supabase = createAdminClient();

  // Get company ID for the webinar to fetch config
  const { data: webinar, error: webinarError } = await supabase
    .from('webinars')
    .select('company_id')
    .eq('id', webinarId)
    .single();

  if (webinarError) {
    throw new Error(`Failed to get webinar: ${webinarError.message}`);
  }

  // Get company's engagement config (or use defaults)
  const config = await getEngagementConfig(webinar.company_id);

  // Calculate points based on event type
  let pointsEarned = 0;
  if (eventType === 'watch_milestone' && eventData?.milestone) {
    const milestone = eventData.milestone as number;
    if (config) {
      const milestoneKey = `watch_${milestone}_points` as keyof EngagementConfig;
      pointsEarned = (config[milestoneKey] as number) || DEFAULT_MILESTONE_POINTS[milestone] || 0;
    } else {
      pointsEarned = DEFAULT_MILESTONE_POINTS[milestone] || 0;
    }
  } else if (config) {
    const pointsKey = `${eventType}_points` as keyof EngagementConfig;
    pointsEarned = (config[pointsKey] as number) || DEFAULT_POINTS[eventType];
  } else {
    pointsEarned = DEFAULT_POINTS[eventType];
  }

  const { data, error } = await supabase
    .from('engagement_events')
    .insert({
      webinar_id: webinarId,
      registration_id: registrationId,
      event_type: eventType,
      event_data: eventData || null,
      points_earned: pointsEarned,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to track engagement event: ${error.message}`);
  }

  return data;
}

/**
 * Get engagement events for a registration
 */
export async function getRegistrationEngagementEvents(
  registrationId: string
): Promise<EngagementEvent[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('engagement_events')
    .select('*')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get engagement events: ${error.message}`);
  }

  return data;
}

/**
 * Get engagement events for a webinar
 */
export async function getWebinarEngagementEvents(
  webinarId: string,
  options?: {
    eventType?: EngagementEventType;
    limit?: number;
  }
): Promise<EngagementEvent[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('engagement_events')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: false });

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get engagement events: ${error.message}`);
  }

  return data;
}

/**
 * Get total engagement score for a registration
 */
export async function getRegistrationEngagementScore(
  registrationId: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('engagement_events')
    .select('points_earned')
    .eq('registration_id', registrationId);

  if (error) {
    throw new Error(`Failed to get engagement score: ${error.message}`);
  }

  return data.reduce((sum, event) => sum + (event.points_earned || 0), 0);
}

/**
 * Get engagement stats for a webinar
 */
export interface WebinarEngagementStats {
  totalEvents: number;
  totalPoints: number;
  eventBreakdown: Record<EngagementEventType, number>;
  uniqueParticipants: number;
  avgPointsPerParticipant: number;
}

export async function getWebinarEngagementStats(
  webinarId: string
): Promise<WebinarEngagementStats> {
  const supabase = createAdminClient();

  const { data: events, error } = await supabase
    .from('engagement_events')
    .select('event_type, points_earned, registration_id')
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to get engagement stats: ${error.message}`);
  }

  const eventBreakdown: Record<string, number> = {};
  const uniqueRegistrations = new Set<string>();
  let totalPoints = 0;

  events.forEach((event) => {
    eventBreakdown[event.event_type] = (eventBreakdown[event.event_type] || 0) + 1;
    totalPoints += event.points_earned || 0;
    uniqueRegistrations.add(event.registration_id);
  });

  const uniqueParticipants = uniqueRegistrations.size;

  return {
    totalEvents: events.length,
    totalPoints,
    eventBreakdown: eventBreakdown as Record<EngagementEventType, number>,
    uniqueParticipants,
    avgPointsPerParticipant: uniqueParticipants > 0
      ? Math.round(totalPoints / uniqueParticipants)
      : 0,
  };
}

// ============================================
// Engagement Configuration
// ============================================

/**
 * Get engagement config for a company
 * Returns null if no config exists (defaults will be used)
 */
export async function getEngagementConfig(
  companyId: string
): Promise<EngagementConfig | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('engagement_configs')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get engagement config: ${error.message}`);
  }

  return data;
}

/**
 * Get engagement config with defaults filled in
 */
export async function getEngagementConfigWithDefaults(
  companyId: string
): Promise<Omit<EngagementConfig, 'id' | 'created_at' | 'updated_at'>> {
  const config = await getEngagementConfig(companyId);

  return {
    company_id: companyId,
    chat_message_points: config?.chat_message_points ?? 1,
    qa_submit_points: config?.qa_submit_points ?? 3,
    qa_upvote_points: config?.qa_upvote_points ?? 1,
    poll_response_points: config?.poll_response_points ?? 2,
    reaction_points: config?.reaction_points ?? 1,
    cta_click_points: config?.cta_click_points ?? 5,
    watch_25_points: config?.watch_25_points ?? 5,
    watch_50_points: config?.watch_50_points ?? 10,
    watch_75_points: config?.watch_75_points ?? 15,
    watch_100_points: config?.watch_100_points ?? 25,
  };
}

/**
 * Create or update engagement config for a company
 */
export async function upsertEngagementConfig(
  companyId: string,
  config: EngagementConfigUpdate
): Promise<EngagementConfig> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('engagement_configs')
    .upsert({
      company_id: companyId,
      ...config,
    }, {
      onConflict: 'company_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update engagement config: ${error.message}`);
  }

  return data;
}

/**
 * Reset engagement config to defaults
 */
export async function resetEngagementConfig(companyId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('engagement_configs')
    .delete()
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to reset engagement config: ${error.message}`);
  }
}
