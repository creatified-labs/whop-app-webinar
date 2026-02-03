/**
 * Lead Scoring Data Functions
 * Calculate and manage lead scores for registrations
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { LeadScore, LeadScoreUpdate, Registration } from '@/types/database';
import { getRegistrationEngagementScore } from './engagement';
import { getRegistrationTotalWatchTime, getRegistrationHighestMilestone } from './watch-time';

// ============================================
// Lead Score Calculation
// ============================================

/**
 * Calculate and update lead score for a registration
 */
export async function calculateLeadScore(
  registrationId: string
): Promise<LeadScore> {
  const supabase = createAdminClient();

  // Get engagement score from events
  const engagementScore = await getRegistrationEngagementScore(registrationId);

  // Get watch time data
  const totalWatchSeconds = await getRegistrationTotalWatchTime(registrationId);
  const highestMilestone = await getRegistrationHighestMilestone(registrationId);

  // Calculate watch time score (based on total seconds and milestones)
  // Base: 1 point per 60 seconds watched
  const watchTimeScore = Math.floor(totalWatchSeconds / 60);

  // Calculate interaction score from registration data
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('attended, watched_replay')
    .eq('id', registrationId)
    .single();

  if (regError) {
    throw new Error(`Failed to get registration: ${regError.message}`);
  }

  // Interaction score: bonus for attending live or watching replay
  let interactionScore = 0;
  if (registration.attended) {
    interactionScore += 10; // Bonus for live attendance
  }
  if (registration.watched_replay) {
    interactionScore += 5; // Bonus for watching replay
  }

  // Total score is sum of all components
  const totalScore = engagementScore + watchTimeScore + interactionScore;

  // Upsert lead score
  const { data, error } = await supabase
    .from('lead_scores')
    .upsert({
      registration_id: registrationId,
      total_score: totalScore,
      engagement_score: engagementScore,
      watch_time_score: watchTimeScore,
      interaction_score: interactionScore,
      last_calculated_at: new Date().toISOString(),
    }, {
      onConflict: 'registration_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead score: ${error.message}`);
  }

  return data;
}

/**
 * Get lead score for a registration
 * Returns null if not calculated yet
 */
export async function getLeadScore(
  registrationId: string
): Promise<LeadScore | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('lead_scores')
    .select('*')
    .eq('registration_id', registrationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get lead score: ${error.message}`);
  }

  return data;
}

/**
 * Get or calculate lead score for a registration
 */
export async function getOrCalculateLeadScore(
  registrationId: string
): Promise<LeadScore> {
  const existing = await getLeadScore(registrationId);
  if (existing) {
    return existing;
  }
  return calculateLeadScore(registrationId);
}

/**
 * Bulk recalculate lead scores for all registrations in a webinar
 */
export async function recalculateWebinarLeadScores(
  webinarId: string
): Promise<number> {
  const supabase = createAdminClient();

  // Get all registrations for this webinar
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('id')
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to get registrations: ${error.message}`);
  }

  // Recalculate each score
  let count = 0;
  for (const registration of registrations) {
    await calculateLeadScore(registration.id);
    count++;
  }

  return count;
}

// ============================================
// Lead Score Queries
// ============================================

export interface LeadScoreWithRegistration extends LeadScore {
  registration: Pick<Registration, 'id' | 'email' | 'name' | 'attended' | 'watched_replay' | 'created_at'>;
}

/**
 * Get lead score leaderboard for a webinar
 */
export async function getLeadScoreLeaderboard(
  webinarId: string,
  options?: {
    limit?: number;
    offset?: number;
    minScore?: number;
  }
): Promise<LeadScoreWithRegistration[]> {
  const supabase = createAdminClient();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Get registrations for this webinar with their lead scores
  let query = supabase
    .from('lead_scores')
    .select(`
      *,
      registration:registrations!inner(
        id,
        email,
        name,
        attended,
        watched_replay,
        created_at,
        webinar_id
      )
    `)
    .order('total_score', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }

  // Filter by webinar_id (since we can't do this in the query directly with the join)
  const filtered = data.filter((item: any) => item.registration.webinar_id === webinarId);

  // Apply min score filter if specified
  const withMinScore = options?.minScore
    ? filtered.filter((item) => item.total_score >= options.minScore!)
    : filtered;

  return withMinScore.map((item: any) => ({
    ...item,
    registration: {
      id: item.registration.id,
      email: item.registration.email,
      name: item.registration.name,
      attended: item.registration.attended,
      watched_replay: item.registration.watched_replay,
      created_at: item.registration.created_at,
    },
  }));
}

/**
 * Get lead score distribution for a webinar
 */
export interface LeadScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export async function getLeadScoreDistribution(
  webinarId: string
): Promise<LeadScoreDistribution[]> {
  const supabase = createAdminClient();

  // Get all registrations and their scores
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('id')
    .eq('webinar_id', webinarId);

  if (regError) {
    throw new Error(`Failed to get registrations: ${regError.message}`);
  }

  if (registrations.length === 0) {
    return [];
  }

  const registrationIds = registrations.map((r) => r.id);

  const { data: scores, error: scoreError } = await supabase
    .from('lead_scores')
    .select('total_score')
    .in('registration_id', registrationIds);

  if (scoreError) {
    throw new Error(`Failed to get scores: ${scoreError.message}`);
  }

  // Define score ranges
  const ranges = [
    { label: '0-10', min: 0, max: 10 },
    { label: '11-25', min: 11, max: 25 },
    { label: '26-50', min: 26, max: 50 },
    { label: '51-100', min: 51, max: 100 },
    { label: '100+', min: 101, max: Infinity },
  ];

  const total = scores.length;
  const distribution = ranges.map(({ label, min, max }) => {
    const count = scores.filter(
      (s) => s.total_score >= min && s.total_score <= max
    ).length;
    return {
      range: label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  return distribution;
}

/**
 * Get lead score summary stats for a webinar
 */
export interface LeadScoreSummary {
  totalScored: number;
  avgScore: number;
  medianScore: number;
  maxScore: number;
  minScore: number;
  topScorers: LeadScoreWithRegistration[];
}

export async function getLeadScoreSummary(
  webinarId: string
): Promise<LeadScoreSummary> {
  const supabase = createAdminClient();

  // Get all registrations for this webinar
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select('id')
    .eq('webinar_id', webinarId);

  if (regError) {
    throw new Error(`Failed to get registrations: ${regError.message}`);
  }

  if (registrations.length === 0) {
    return {
      totalScored: 0,
      avgScore: 0,
      medianScore: 0,
      maxScore: 0,
      minScore: 0,
      topScorers: [],
    };
  }

  const registrationIds = registrations.map((r) => r.id);

  const { data: scores, error: scoreError } = await supabase
    .from('lead_scores')
    .select('total_score')
    .in('registration_id', registrationIds);

  if (scoreError) {
    throw new Error(`Failed to get scores: ${scoreError.message}`);
  }

  if (scores.length === 0) {
    return {
      totalScored: 0,
      avgScore: 0,
      medianScore: 0,
      maxScore: 0,
      minScore: 0,
      topScorers: [],
    };
  }

  const sortedScores = scores.map((s) => s.total_score).sort((a, b) => a - b);
  const sum = sortedScores.reduce((a, b) => a + b, 0);
  const midIndex = Math.floor(sortedScores.length / 2);
  const median = sortedScores.length % 2 === 0
    ? (sortedScores[midIndex - 1] + sortedScores[midIndex]) / 2
    : sortedScores[midIndex];

  // Get top 5 scorers
  const topScorers = await getLeadScoreLeaderboard(webinarId, { limit: 5 });

  return {
    totalScored: scores.length,
    avgScore: Math.round(sum / scores.length),
    medianScore: Math.round(median),
    maxScore: sortedScores[sortedScores.length - 1],
    minScore: sortedScores[0],
    topScorers,
  };
}

/**
 * Export lead scores for a webinar as CSV data
 */
export async function exportLeadScores(
  webinarId: string
): Promise<string> {
  const leaderboard = await getLeadScoreLeaderboard(webinarId, { limit: 10000 });

  const headers = [
    'Email',
    'Name',
    'Total Score',
    'Engagement Score',
    'Watch Time Score',
    'Interaction Score',
    'Attended Live',
    'Watched Replay',
    'Registered At',
    'Last Calculated',
  ];

  const rows = leaderboard.map((item) => [
    item.registration.email,
    item.registration.name || '',
    item.total_score.toString(),
    item.engagement_score.toString(),
    item.watch_time_score.toString(),
    item.interaction_score.toString(),
    item.registration.attended ? 'Yes' : 'No',
    item.registration.watched_replay ? 'Yes' : 'No',
    new Date(item.registration.created_at).toISOString(),
    new Date(item.last_calculated_at).toISOString(),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csv;
}
