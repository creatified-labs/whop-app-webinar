'use client';

import { useTransition } from 'react';
import { Button } from '@whop/react/components';
import { Radio, Square, Loader2, RefreshCw } from 'lucide-react';
import { startStream, endStream, reconnectStream } from '@/app/actions/stream';
import { useRouter } from 'next/navigation';
import type { StreamStatus } from '@/types/database';

interface StreamControlsProps {
  webinarId: string;
  streamStatus: StreamStatus | null;
  hasMediaStream: boolean;
}

/**
 * Stream Controls Component
 * Go Live / End Stream / Reconnect buttons
 */
export function StreamControls({
  webinarId,
  streamStatus,
  hasMediaStream,
}: StreamControlsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGoLive = () => {
    startTransition(async () => {
      const result = await startStream(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to start stream');
      }
    });
  };

  const handleEndStream = () => {
    if (!confirm('Are you sure you want to end the stream?')) return;

    startTransition(async () => {
      const result = await endStream(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to end stream');
      }
    });
  };

  const handleReconnect = () => {
    startTransition(async () => {
      const result = await reconnectStream(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to reconnect stream');
      }
    });
  };

  // Stream is live
  if (streamStatus === 'live') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-red-500">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="font-medium">LIVE</span>
        </div>
        <Button
          size="3"
          color="red"
          variant="soft"
          onClick={handleEndStream}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          End Stream
        </Button>
      </div>
    );
  }

  // Stream ended - show reconnect
  if (streamStatus === 'ended') {
    return (
      <Button
        size="3"
        color="green"
        onClick={handleReconnect}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Reconnect Stream
      </Button>
    );
  }

  // Idle or connecting - show go live button
  return (
    <Button
      size="3"
      color="red"
      onClick={handleGoLive}
      disabled={isPending || !hasMediaStream}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Radio className="h-4 w-4" />
      )}
      Go Live
    </Button>
  );
}
