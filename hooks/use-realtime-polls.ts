'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEngagement } from '@/app/actions/analytics';
import type { Poll, PollStatus } from '@/types/database';
import type { PollWithResults } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UsePollsOptions {
  webinarId: string;
  registrationId: string;
  initialPolls?: PollWithResults[];
  initialResponses?: Record<string, string[]>; // pollId -> selected option IDs
}

export function useRealtimePolls({
  webinarId,
  registrationId,
  initialPolls = [],
  initialResponses = {},
}: UsePollsOptions) {
  const [polls, setPolls] = useState<PollWithResults[]>(initialPolls);
  const [responses, setResponses] = useState<Record<string, string[]>>(initialResponses);
  const [isConnected, setIsConnected] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Get active poll (most recently activated)
  const activePoll = polls.find((p) => p.status === 'active');

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to poll changes
    const channel = supabase
      .channel(`polls:${webinarId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `webinar_id=eq.${webinarId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPoll = payload.new as Poll;
            setPolls((prev) => [
              ...prev,
              {
                ...newPoll,
                results: (newPoll.options as { id: string; text: string }[]).map((opt) => ({
                  option_id: opt.id,
                  count: 0,
                  percentage: 0,
                })),
                total_responses: 0,
              },
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedPoll = payload.new as Poll;
            setPolls((prev) =>
              prev.map((p) =>
                p.id === updatedPoll.id
                  ? { ...p, ...updatedPoll }
                  : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPolls((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poll_responses',
        },
        async (payload) => {
          const response = payload.new as { poll_id: string; selected_options: string[] };
          // Update results count
          setPolls((prev) =>
            prev.map((poll) => {
              if (poll.id !== response.poll_id) return poll;

              const newTotalResponses = poll.total_responses + 1;
              const newResults = poll.results.map((result) => {
                const isSelected = response.selected_options.includes(result.option_id);
                const newCount = isSelected ? result.count + 1 : result.count;
                return {
                  ...result,
                  count: newCount,
                  percentage: Math.round((newCount / newTotalResponses) * 100),
                };
              });

              return {
                ...poll,
                results: newResults,
                total_responses: newTotalResponses,
              };
            })
          );
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

  const vote = useCallback(
    async (pollId: string, selectedOptions: string[]) => {
      if (isVoting || responses[pollId]) return; // Already voted

      setIsVoting(true);

      // Optimistic update
      setResponses((prev) => ({ ...prev, [pollId]: selectedOptions }));

      try {
        const supabase = createClient();
        const { error } = await supabase.from('poll_responses').insert({
          poll_id: pollId,
          registration_id: registrationId,
          selected_options: selectedOptions,
        });

        if (error) {
          // Revert on error
          setResponses((prev) => {
            const updated = { ...prev };
            delete updated[pollId];
            return updated;
          });
          throw error;
        }

        // Track engagement event
        trackEngagement(webinarId, registrationId, 'poll_response', { poll_id: pollId }).catch(console.error);
      } catch (err) {
        console.error('Failed to vote:', err);
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [webinarId, registrationId, isVoting, responses]
  );

  const hasVoted = useCallback(
    (pollId: string) => {
      return pollId in responses;
    },
    [responses]
  );

  const getVote = useCallback(
    (pollId: string) => {
      return responses[pollId] || null;
    },
    [responses]
  );

  return {
    polls,
    activePoll,
    isConnected,
    isVoting,
    vote,
    hasVoted,
    getVote,
  };
}
