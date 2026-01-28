'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Reaction } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

const REACTION_EMOJIS = ['🔥', '❤️', '👏', '😂', '😮', '🎉', '💯', '👍'] as const;

interface UseReactionsOptions {
  webinarId: string;
  registrationId: string;
  maxDisplayedReactions?: number; // Max reactions to show floating
  reactionLifetimeMs?: number; // How long reactions stay visible
}

interface FloatingReaction extends Reaction {
  key: string; // Unique key for animation
}

export function useRealtimeReactions({
  webinarId,
  registrationId,
  maxDisplayedReactions = 20,
  reactionLifetimeMs = 3000,
}: UseReactionsOptions) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reactionKeyRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new reactions
    const channel = supabase
      .channel(`reactions:${webinarId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const newReaction = payload.new as Reaction;

          // Add to floating reactions with unique key
          const key = `${newReaction.id}-${reactionKeyRef.current++}`;
          setFloatingReactions((prev) => {
            const updated = [...prev, { ...newReaction, key }];
            // Keep only maxDisplayedReactions
            if (updated.length > maxDisplayedReactions) {
              return updated.slice(-maxDisplayedReactions);
            }
            return updated;
          });

          // Update counts
          setReactionCounts((prev) => ({
            ...prev,
            [newReaction.emoji]: (prev[newReaction.emoji] || 0) + 1,
          }));

          // Remove after lifetime
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.key !== key));
          }, reactionLifetimeMs);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [webinarId, maxDisplayedReactions, reactionLifetimeMs]);

  const sendReaction = useCallback(
    async (emoji: string) => {
      if (isSending) return;

      // Validate emoji
      if (!REACTION_EMOJIS.includes(emoji as typeof REACTION_EMOJIS[number])) {
        console.error('Invalid emoji:', emoji);
        return;
      }

      setIsSending(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.from('reactions').insert({
          webinar_id: webinarId,
          registration_id: registrationId,
          emoji,
        });

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error('Failed to send reaction:', err);
      } finally {
        // Small delay to prevent spam
        setTimeout(() => setIsSending(false), 200);
      }
    },
    [webinarId, registrationId, isSending]
  );

  return {
    floatingReactions,
    reactionCounts,
    isConnected,
    isSending,
    sendReaction,
    availableEmojis: REACTION_EMOJIS,
  };
}
