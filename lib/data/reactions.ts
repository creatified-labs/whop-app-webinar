/**
 * Reactions Data Functions
 * CRUD operations for webinar reactions
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Reaction, ReactionInsert } from '@/types/database';

// Available reaction emojis
export const REACTION_EMOJIS = ['🔥', '❤️', '👏', '😂', '😮', '🎉', '💯', '👍'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

// ============================================
// Reaction Functions
// ============================================

/**
 * Send a reaction
 */
export async function sendReaction(
  webinarId: string,
  registrationId: string,
  emoji: string
): Promise<Reaction> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('reactions')
    .insert({
      webinar_id: webinarId,
      registration_id: registrationId,
      emoji,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send reaction: ${error.message}`);
  }

  return data;
}

/**
 * Get recent reactions for a webinar
 */
export async function getRecentReactions(
  webinarId: string,
  limit: number = 50
): Promise<Reaction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get reactions: ${error.message}`);
  }

  return data.reverse();
}

/**
 * Get reaction counts for a webinar
 */
export async function getReactionCounts(
  webinarId: string
): Promise<Record<string, number>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to get reaction counts: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  for (const reaction of data) {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  }

  return counts;
}

/**
 * Get total reaction count for a webinar
 */
export async function getTotalReactionCount(webinarId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('reactions')
    .select('*', { count: 'exact', head: true })
    .eq('webinar_id', webinarId);

  if (error) {
    throw new Error(`Failed to count reactions: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get reactions in a time window (for rate limiting display)
 */
export async function getReactionsInWindow(
  webinarId: string,
  windowSeconds: number = 5
): Promise<Reaction[]> {
  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('webinar_id', webinarId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get reactions: ${error.message}`);
  }

  return data;
}

/**
 * Delete old reactions (cleanup)
 */
export async function deleteOldReactions(
  webinarId: string,
  olderThanMinutes: number = 60
): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('reactions')
    .delete()
    .eq('webinar_id', webinarId)
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete reactions: ${error.message}`);
  }

  return data.length;
}
