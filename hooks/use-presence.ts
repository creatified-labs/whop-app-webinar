'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UsePresenceOptions {
  webinarId: string;
  registrationId: string;
  userName?: string;
}

interface PresenceState {
  registration_id: string;
  name?: string;
  joined_at: string;
}

export function usePresence({
  webinarId,
  registrationId,
  userName,
}: UsePresenceOptions) {
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<PresenceState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Create presence channel
    const channel = supabase.channel(`presence:${webinarId}`, {
      config: {
        presence: {
          key: registrationId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const allPresences = Object.values(state).flat();
        setViewers(allPresences);
        setViewerCount(allPresences.length);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setViewers((prev) => [...prev, ...(newPresences as unknown as PresenceState[])]);
        setViewerCount((prev) => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set((leftPresences as unknown as PresenceState[]).map((p) => p.registration_id));
        setViewers((prev) => prev.filter((v) => !leftIds.has(v.registration_id)));
        setViewerCount((prev) => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await channel.track({
            registration_id: registrationId,
            name: userName,
            joined_at: new Date().toISOString(),
          });
          setIsConnected(true);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [webinarId, registrationId, userName]);

  return {
    viewerCount,
    viewers,
    isConnected,
  };
}
