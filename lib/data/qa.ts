/**
 * Q&A Data Functions
 * CRUD operations for Q&A questions and upvotes
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { QAQuestion, QAQuestionInsert, QAQuestionUpdate, QAQuestionStatus, QAUpvote } from '@/types/database';

// ============================================
// Question Types
// ============================================

export interface QuestionWithMeta extends QAQuestion {
  has_upvoted?: boolean;
}

// ============================================
// Question CRUD
// ============================================

/**
 * Submit a new question
 */
export async function submitQuestion(
  webinarId: string,
  registrationId: string,
  question: string
): Promise<QAQuestion> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('qa_questions')
    .insert({
      webinar_id: webinarId,
      registration_id: registrationId,
      question,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit question: ${error.message}`);
  }

  return data;
}

/**
 * Get questions for a webinar
 */
export async function getQuestions(
  webinarId: string,
  options?: {
    status?: QAQuestionStatus;
    includeHidden?: boolean;
  }
): Promise<QAQuestion[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('qa_questions')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (!options?.includeHidden) {
    query = query.eq('is_hidden', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get questions: ${error.message}`);
  }

  return data;
}

/**
 * Get questions with user's upvote status
 */
export async function getQuestionsWithUpvoteStatus(
  webinarId: string,
  registrationId: string
): Promise<QuestionWithMeta[]> {
  const supabase = createAdminClient();

  // Get questions
  const { data: questions, error: questionsError } = await supabase
    .from('qa_questions')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('is_hidden', false)
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: true });

  if (questionsError) {
    throw new Error(`Failed to get questions: ${questionsError.message}`);
  }

  // Get user's upvotes
  const questionIds = questions.map((q) => q.id);
  const { data: upvotes, error: upvotesError } = await supabase
    .from('qa_upvotes')
    .select('question_id')
    .eq('registration_id', registrationId)
    .in('question_id', questionIds);

  if (upvotesError) {
    throw new Error(`Failed to get upvotes: ${upvotesError.message}`);
  }

  const upvotedIds = new Set(upvotes?.map((u) => u.question_id) || []);

  return questions.map((q) => ({
    ...q,
    has_upvoted: upvotedIds.has(q.id),
  }));
}

/**
 * Get highlighted questions
 */
export async function getHighlightedQuestions(webinarId: string): Promise<QAQuestion[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('qa_questions')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('is_highlighted', true)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get highlighted questions: ${error.message}`);
  }

  return data;
}

/**
 * Update question status
 */
export async function updateQuestionStatus(
  questionId: string,
  status: QAQuestionStatus
): Promise<QAQuestion> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('qa_questions')
    .update({ status })
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`);
  }

  return data;
}

/**
 * Answer a question
 */
export async function answerQuestion(
  questionId: string,
  answer: string,
  answeredBy: string
): Promise<QAQuestion> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('qa_questions')
    .update({
      status: 'answered',
      answer,
      answered_by: answeredBy,
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to answer question: ${error.message}`);
  }

  return data;
}

/**
 * Dismiss a question
 */
export async function dismissQuestion(questionId: string): Promise<QAQuestion> {
  return updateQuestionStatus(questionId, 'dismissed');
}

/**
 * Highlight/unhighlight a question
 */
export async function toggleQuestionHighlight(
  questionId: string,
  isHighlighted: boolean
): Promise<QAQuestion> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('qa_questions')
    .update({ is_highlighted: isHighlighted })
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`);
  }

  return data;
}

/**
 * Hide/unhide a question (moderation)
 */
export async function toggleQuestionHidden(
  questionId: string,
  isHidden: boolean
): Promise<QAQuestion> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('qa_questions')
    .update({ is_hidden: isHidden })
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`);
  }

  return data;
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('qa_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    throw new Error(`Failed to delete question: ${error.message}`);
  }
}

// ============================================
// Upvote Functions
// ============================================

/**
 * Toggle upvote on a question
 */
export async function toggleUpvote(
  questionId: string,
  registrationId: string
): Promise<{ upvoted: boolean; newCount: number }> {
  const supabase = createAdminClient();

  // Check if already upvoted
  const { data: existing } = await supabase
    .from('qa_upvotes')
    .select('id')
    .eq('question_id', questionId)
    .eq('registration_id', registrationId)
    .single();

  if (existing) {
    // Remove upvote
    const { error: deleteError } = await supabase
      .from('qa_upvotes')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      throw new Error(`Failed to remove upvote: ${deleteError.message}`);
    }

    // Decrement count
    const { data: question, error: updateError } = await supabase.rpc(
      'decrement_upvote_count',
      { question_id: questionId }
    );

    // Fallback if RPC doesn't exist - get current count
    const { data: updated } = await supabase
      .from('qa_questions')
      .select('upvote_count')
      .eq('id', questionId)
      .single();

    return { upvoted: false, newCount: updated?.upvote_count || 0 };
  } else {
    // Add upvote
    const { error: insertError } = await supabase
      .from('qa_upvotes')
      .insert({
        question_id: questionId,
        registration_id: registrationId,
      });

    if (insertError) {
      throw new Error(`Failed to add upvote: ${insertError.message}`);
    }

    // Increment count
    const { data: question, error: updateError } = await supabase.rpc(
      'increment_upvote_count',
      { question_id: questionId }
    );

    // Fallback - get current count
    const { data: updated } = await supabase
      .from('qa_questions')
      .select('upvote_count')
      .eq('id', questionId)
      .single();

    return { upvoted: true, newCount: updated?.upvote_count || 0 };
  }
}

/**
 * Get question count for a webinar
 */
export async function getQuestionCount(
  webinarId: string,
  status?: QAQuestionStatus
): Promise<number> {
  const supabase = createAdminClient();

  let query = supabase
    .from('qa_questions')
    .select('*', { count: 'exact', head: true })
    .eq('webinar_id', webinarId)
    .eq('is_hidden', false);

  if (status) {
    query = query.eq('status', status);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count questions: ${error.message}`);
  }

  return count || 0;
}
