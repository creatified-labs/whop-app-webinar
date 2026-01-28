'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { QAQuestion } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseQAOptions {
  webinarId: string;
  registrationId: string;
  initialQuestions?: QAQuestion[];
  initialUpvotedIds?: string[];
}

interface QuestionWithUpvote extends QAQuestion {
  has_upvoted: boolean;
}

export function useRealtimeQA({
  webinarId,
  registrationId,
  initialQuestions = [],
  initialUpvotedIds = [],
}: UseQAOptions) {
  const [questions, setQuestions] = useState<QuestionWithUpvote[]>(
    initialQuestions.map((q) => ({
      ...q,
      has_upvoted: initialUpvotedIds.includes(q.id),
    }))
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const upvotedIdsRef = useRef<Set<string>>(new Set(initialUpvotedIds));
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to question changes
    const channel = supabase
      .channel(`qa:${webinarId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qa_questions',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const newQuestion = payload.new as QAQuestion;
          if (!newQuestion.is_hidden) {
            setQuestions((prev) => {
              const updated = [
                ...prev,
                { ...newQuestion, has_upvoted: upvotedIdsRef.current.has(newQuestion.id) },
              ];
              return sortQuestions(updated);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qa_questions',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const updatedQuestion = payload.new as QAQuestion;
          setQuestions((prev) => {
            const updated = prev
              .map((q) =>
                q.id === updatedQuestion.id
                  ? { ...updatedQuestion, has_upvoted: upvotedIdsRef.current.has(q.id) }
                  : q
              )
              .filter((q) => !q.is_hidden);
            return sortQuestions(updated);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'qa_questions',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setQuestions((prev) => prev.filter((q) => q.id !== deletedId));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [webinarId]);

  const submitQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.from('qa_questions').insert({
          webinar_id: webinarId,
          registration_id: registrationId,
          question: question.trim(),
        });

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error('Failed to submit question:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [webinarId, registrationId, isSubmitting]
  );

  const toggleUpvote = useCallback(
    async (questionId: string) => {
      const supabase = createClient();
      const hasUpvoted = upvotedIdsRef.current.has(questionId);

      // Optimistic update
      if (hasUpvoted) {
        upvotedIdsRef.current.delete(questionId);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, has_upvoted: false, upvote_count: Math.max(0, q.upvote_count - 1) }
              : q
          )
        );
      } else {
        upvotedIdsRef.current.add(questionId);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, has_upvoted: true, upvote_count: q.upvote_count + 1 }
              : q
          )
        );
      }

      try {
        if (hasUpvoted) {
          // Remove upvote
          await supabase
            .from('qa_upvotes')
            .delete()
            .eq('question_id', questionId)
            .eq('registration_id', registrationId);

          // Decrement count
          await supabase.rpc('decrement_upvote_count', { question_id: questionId });
        } else {
          // Add upvote
          await supabase.from('qa_upvotes').insert({
            question_id: questionId,
            registration_id: registrationId,
          });

          // Increment count
          await supabase.rpc('increment_upvote_count', { question_id: questionId });
        }
      } catch (err) {
        // Revert on error
        if (hasUpvoted) {
          upvotedIdsRef.current.add(questionId);
        } else {
          upvotedIdsRef.current.delete(questionId);
        }
        // Refetch to get correct state
        console.error('Failed to toggle upvote:', err);
      }
    },
    [registrationId]
  );

  return {
    questions,
    isConnected,
    isSubmitting,
    submitQuestion,
    toggleUpvote,
  };
}

// Sort questions by upvote count (desc), then by date (asc)
function sortQuestions(questions: QuestionWithUpvote[]): QuestionWithUpvote[] {
  return [...questions].sort((a, b) => {
    if (b.upvote_count !== a.upvote_count) {
      return b.upvote_count - a.upvote_count;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
