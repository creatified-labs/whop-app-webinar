import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, Heading, Text, Badge, Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarById } from '@/lib/data/webinars';
import { getRtmpUrl, getWhipUrl } from '@/lib/integrations/mux/client';
import { BroadcastStudio } from '@/components/broadcast';
import { setupStream } from '@/app/actions/stream';
import type { WebinarStatus, StreamStatus } from '@/types/database';

interface BroadcastPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

const statusConfig: Record<WebinarStatus, { color: 'gray' | 'blue' | 'red' | 'green' | 'orange'; label: string }> = {
  draft: { color: 'gray', label: 'Draft' },
  scheduled: { color: 'blue', label: 'Scheduled' },
  live: { color: 'red', label: 'Live' },
  ended: { color: 'green', label: 'Ended' },
  cancelled: { color: 'orange', label: 'Cancelled' },
};

/**
 * Broadcast Page
 * Hosts can preview their camera/screen and manage live streaming
 */
export default async function BroadcastPage({ params }: BroadcastPageProps) {
  const { companyId, webinarId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get webinar
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    notFound();
  }

  const status = statusConfig[webinar.status];

  // If no stream is configured, show setup prompt
  if (!webinar.stream_key) {
    return (
      <div className="p-6">
        {/* Back Link */}
        <Link
          href={`/dashboard/${companyId}/webinars/${webinarId}`}
          className="mb-6 inline-flex items-center gap-2 text-2 font-medium text-gray-11 transition-colors hover:text-gray-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webinar
        </Link>

        {/* Header */}
        <Card size="2" className="mb-6">
          <div className="flex items-center gap-3">
            <Heading size="5" weight="bold">
              {webinar.title}
            </Heading>
            <Badge size="1" color={status.color} variant="solid">
              {status.label}
            </Badge>
          </div>
        </Card>

        {/* Setup Prompt */}
        <Card size="2">
          <div className="text-center py-12">
            <Heading size="4" weight="semi-bold" className="mb-2">
              Setup Live Streaming
            </Heading>
            <Text color="gray" size="2" className="mb-6 block max-w-md mx-auto">
              Configure live streaming for this webinar. You can stream directly from your browser or use OBS/streaming software.
            </Text>
            <form
              action={async () => {
                'use server';
                const result = await setupStream(webinarId);
                if (result.success) {
                  redirect(`/dashboard/${companyId}/webinars/${webinarId}/broadcast`);
                }
              }}
            >
              <Button type="submit" size="3" color="blue">
                Setup Live Stream
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  // Stream is configured, show broadcast studio
  return (
    <div className="p-6">
      {/* Back Link */}
      <Link
        href={`/dashboard/${companyId}/webinars/${webinarId}`}
        className="mb-6 inline-flex items-center gap-2 text-2 font-medium text-gray-11 transition-colors hover:text-gray-12"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Webinar
      </Link>

      {/* Broadcast Studio */}
      <BroadcastStudio
        webinarId={webinarId}
        webinarTitle={webinar.title}
        streamKey={webinar.stream_key}
        rtmpUrl={getRtmpUrl()}
        whipUrl={getWhipUrl(webinar.stream_key)}
        streamStatus={webinar.stream_status as StreamStatus | null}
      />
    </div>
  );
}
