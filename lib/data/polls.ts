/**
 * Poll Data Functions
 * CRUD operations for polls and poll responses
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Poll, PollInsert, PollUpdate, PollStatus } from '@/types/database';
import type { PollWithResults } from '@/types';

// ============================================
// Poll CRUD
// ============================================

/**
 * Create a new poll
 */
export async function createPoll(
  webinarId: string,
  data: Omit<PollInsert, 'webinar_id'>
): Promise<Poll> {
  const supabase = createAdminClient();

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      ...data,
      webinar_id: webinarId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create poll: ${error.message}`);
  }

  return poll;
}

/**
 * Get a poll by ID
 */
export async function getPollById(id: string): Promise<Poll | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get poll: ${error.message}`);
  }

  return data;
}

/**
 * Get all polls for a webinar
 */
export async function getWebinarPolls(webinarId: string): Promise<Poll[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get polls: ${error.message}`);
  }

  return data;
}

/**
 * Get polls with results
 */
export async function getWebinarPollsWithResults(
  webinarId: string
): Promise<PollWithResults[]> {
  const supabase = createAdminClient();

  // Get polls
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('created_at', { ascending: true });

  if (pollsError) {
    throw new Error(`Failed to get polls: ${pollsError.message}`);
  }

  // Get responses for all polls
  const pollIds = polls.map((p) => p.id);
  const { data: responses, error: responsesError } = await supabase
    .from('poll_responses')
    .select('*')
    .in('poll_id', pollIds);

  if (responsesError) {
    throw new Error(`Failed to get poll responses: ${responsesError.message}`);
  }

  // Calculate results for each poll
  return polls.map((poll) => {
    const pollResponses = responses?.filter((r) => r.poll_id === poll.id) || [];
    const options = poll.options as { id: string; text: string }[];
    const totalResponses = pollResponses.length;

    const results = options.map((option) => {
      const count = pollResponses.filter((r) =>
        (r.selected_options as string[]).includes(option.id)
      ).length;
      return {
        option_id: option.id,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
      };
    });

    return {
      ...poll,
      results,
      total_responses: totalResponses,
    };
  });
}

/**
 * Update a poll
 */
export async function updatePoll(id: string, updates: PollUpdate): Promise<Poll> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('polls')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update poll: ${error.message}`);
  }

  return data;
}

/**
 * Update poll status
 */
export async function updatePollStatus(id: string, status: PollStatus): Promise<Poll> {
  return updatePoll(id, { status });
}

/**
 * Delete a poll
 */
export async function deletePoll(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete poll: ${error.message}`);
  }
}

// ============================================
// Poll Response Functions
// ============================================

/**
 * Submit a poll response
 */
export async function submitPollResponse(
  pollId: string,
  registrationId: string,
  selectedOptions: string[]
): Promise<void> {
  const supabase = createAdminClient();

  // Check if user already responded
  const { data: existing } = await supabase
    .from('poll_responses')
    .select('id')
    .eq('poll_id', pollId)
    .eq('registration_id', registrationId)
    .single();

  if (existing) {
    // Update existing response
    const { error } = await supabase
      .from('poll_responses')
      .update({ selected_options: selectedOptions })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to update poll response: ${error.message}`);
    }
  } else {
    // Create new response
    const { error } = await supabase
      .from('poll_responses')
      .insert({
        poll_id: pollId,
        registration_id: registrationId,
        selected_options: selectedOptions,
      });

    if (error) {
      throw new Error(`Failed to submit poll response: ${error.message}`);
    }
  }
}

/**
 * Get user's response to a poll
 */
export async function getUserPollResponse(
  pollId: string,
  registrationId: string
): Promise<string[] | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('poll_responses')
    .select('selected_options')
    .eq('poll_id', pollId)
    .eq('registration_id', registrationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get poll response: ${error.message}`);
  }

  return data?.selected_options as string[] | null;
}

/**
 * Get poll results
 */
export async function getPollResults(pollId: string): Promise<{
  results: { option_id: string; count: number; percentage: number }[];
  total_responses: number;
}> {
  const supabase = createAdminClient();

  // Get poll
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('options')
    .eq('id', pollId)
    .single();

  if (pollError) {
    throw new Error(`Failed to get poll: ${pollError.message}`);
  }

  // Get responses
  const { data: responses, error: responsesError } = await supabase
    .from('poll_responses')
    .select('selected_options')
    .eq('poll_id', pollId);

  if (responsesError) {
    throw new Error(`Failed to get poll responses: ${responsesError.message}`);
  }

  const options = poll.options as { id: string; text: string }[];
  const totalResponses = responses?.length || 0;

  const results = options.map((option) => {
    const count = responses?.filter((r) =>
      (r.selected_options as string[]).includes(option.id)
    ).length || 0;
    return {
      option_id: option.id,
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
    };
  });

  return { results, total_responses: totalResponses };
}
