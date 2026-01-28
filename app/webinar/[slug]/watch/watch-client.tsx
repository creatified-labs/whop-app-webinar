'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VideoPlayer } from '@/components/video/video-player';
import { VideoOverlay, LiveIndicator } from '@/components/video/video-overlay';
import { ReactionBar, ReactionContainer } from '@/components/video/reaction-bar';
import { InteractionPanel } from '@/components/watch/interaction-panel';
import { trackAttendance, trackReplayView } from '@/app/actions/registration';
import { hasWebinarStarted, hasWebinarEnded } from '@/lib/utils/date';
import type { WebinarPublicView, Registration } from '@/types';

interface WatchPageClientProps {
  webinar: WebinarPublicView;
  registration: Registration;
  videoUrl: string;
}

/**
 * Watch Page Client Component
 * Split view layout with video and interaction panel
 */
export function WatchPageClient({
  webinar,
  registration,
  videoUrl,
}: WatchPageClientProps) {
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string }>>([]);
  const [hasTracked, setHasTracked] = useState(false);

  const isLive = webinar.status === 'live';
  const isEnded = webinar.status === 'ended';
  const isScheduled = webinar.status === 'scheduled';

  // Track attendance/replay view on mount
  useEffect(() => {
    if (hasTracked) return;

    const track = async () => {
      if (isLive) {
        await trackAttendance(registration.id);
      } else if (isEnded) {
        await trackReplayView(registration.id);
      }
      setHasTracked(true);
    };

    track();
  }, [registration.id, isLive, isEnded, hasTracked]);

  // Handle reaction
  const handleReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setReactions((prev) => [...prev, { id, emoji }]);

    // TODO: Send reaction to server in Phase 5
  }, []);

  // Remove completed reaction animation
  const handleReactionComplete = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Handle countdown complete (refresh page to get updated status)
  const handleCountdownComplete = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href={`/webinar/${webinar.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="truncate text-sm font-medium text-gray-900 sm:text-base">
            {webinar.title}
          </h1>
          {isLive && <LiveIndicator />}
          {isEnded && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              REPLAY
            </span>
          )}
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="mx-auto max-w-7xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Video Section (60%) */}
          <div className="w-full lg:w-3/5">
            <div className="relative overflow-hidden rounded-xl bg-black shadow-lg">
              {/* Video or Overlay */}
              {isScheduled && !hasWebinarStarted(webinar.scheduled_at) ? (
                <VideoOverlay
                  variant="starting-soon"
                  startTime={webinar.scheduled_at}
                  onCountdownComplete={handleCountdownComplete}
                />
              ) : isEnded && !videoUrl ? (
                <VideoOverlay
                  variant="ended"
                  message="Replay will be available soon."
                />
              ) : videoUrl ? (
                <VideoPlayer
                  url={videoUrl}
                  videoType="youtube" // Default, will be dynamic
                  autoplay={isLive}
                />
              ) : (
                <VideoOverlay
                  variant="loading"
                  message="Waiting for stream to start..."
                />
              )}

              {/* Reaction Animations */}
              <ReactionContainer
                reactions={reactions}
                onReactionComplete={handleReactionComplete}
              />
            </div>

            {/* Video Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{webinar.title}</h2>
                <p className="text-sm text-gray-500">{webinar.company.name}</p>
              </div>

              {/* Reactions */}
              {webinar.reactions_enabled && (isLive || isEnded) && (
                <ReactionBar onReaction={handleReaction} />
              )}
            </div>
          </div>

          {/* Interaction Panel (40%) */}
          <div className="h-[500px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:h-[600px] lg:w-2/5">
            <InteractionPanel
              webinarId={webinar.id}
              registrationId={registration.id}
              chatEnabled={webinar.chat_enabled}
              qaEnabled={webinar.qa_enabled}
              pollsEnabled={webinar.polls_enabled}
            />
          </div>
        </div>

        {/* CTA Section */}
        {webinar.cta_text && webinar.cta_url && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
            <a
              href={webinar.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {webinar.cta_text}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
