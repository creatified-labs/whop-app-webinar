'use client';

import { Users } from 'lucide-react';
import { usePresence } from '@/hooks/use-presence';

interface ViewerCountProps {
  webinarId: string;
  registrationId: string;
  userName?: string;
}

/**
 * ViewerCount Component
 * Display live viewer count using Supabase Presence
 */
export function ViewerCount({
  webinarId,
  registrationId,
  userName,
}: ViewerCountProps) {
  const { viewerCount, isConnected } = usePresence({
    webinarId,
    registrationId,
    userName,
  });

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      <Users className="h-4 w-4" />
      <span>
        {isConnected ? (
          <>
            {viewerCount.toLocaleString()} watching
          </>
        ) : (
          'Connecting...'
        )}
      </span>
      {isConnected && (
        <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
      )}
    </div>
  );
}
