'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Play, Square, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@whop/react/components';
import { publishWebinar, startWebinar, endWebinar, reconnectWebinar } from '@/app/actions/webinar';
import type { WebinarStatus } from '@/types/database';

interface WebinarStatusActionsProps {
  webinarId: string;
  status: WebinarStatus;
}

export function WebinarStatusActions({ webinarId, status }: WebinarStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishWebinar(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to publish webinar');
      }
    });
  };

  const handleGoLive = () => {
    startTransition(async () => {
      const result = await startWebinar(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to start webinar');
      }
    });
  };

  const handleEnd = () => {
    if (!confirm('Are you sure you want to end this webinar?')) return;

    startTransition(async () => {
      const result = await endWebinar(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to end webinar');
      }
    });
  };

  const handleReconnect = () => {
    startTransition(async () => {
      const result = await reconnectWebinar(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to reconnect webinar');
      }
    });
  };

  if (status === 'draft') {
    return (
      <Button size="2" variant="solid" onClick={handlePublish} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isPending ? 'Publishing...' : 'Publish'}
      </Button>
    );
  }

  if (status === 'scheduled') {
    return (
      <Button size="2" variant="solid" color="green" onClick={handleGoLive} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isPending ? 'Starting...' : 'Go Live'}
      </Button>
    );
  }

  if (status === 'live') {
    return (
      <Button size="2" variant="soft" color="gray" onClick={handleEnd} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        {isPending ? 'Ending...' : 'End Webinar'}
      </Button>
    );
  }

  if (status === 'ended') {
    return (
      <Button size="2" variant="solid" color="green" onClick={handleReconnect} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isPending ? 'Reconnecting...' : 'Reconnect'}
      </Button>
    );
  }

  return null;
}
