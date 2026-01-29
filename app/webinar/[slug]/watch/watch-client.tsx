"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
import {
  VideoOverlay,
  LiveIndicator,
} from "@/components/video/video-overlay";
import {
  ReactionBar,
  ReactionContainer,
} from "@/components/video/reaction-bar";
import { InteractionPanel } from "@/components/watch/interaction-panel";
import { trackAttendance, trackReplayView } from "@/app/actions/registration";
import { hasWebinarStarted, hasWebinarEnded } from "@/lib/utils/date";
import type { WebinarPublicView, Registration } from "@/types";

interface WatchPageClientProps {
  webinar: WebinarPublicView;
  registration: Registration;
  videoUrl: string;
}

/**
 * Watch Page Client Component
 * Premium 70/30 split layout with glassmorphism effects
 */
export function WatchPageClient({
  webinar,
  registration,
  videoUrl,
}: WatchPageClientProps) {
  const [reactions, setReactions] = useState<
    Array<{ id: string; emoji: string }>
  >([]);
  const [hasTracked, setHasTracked] = useState(false);

  const isLive = webinar.status === "live";
  const isEnded = webinar.status === "ended";
  const isScheduled = webinar.status === "scheduled";

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
    <main className="min-h-screen bg-funnel-bg-primary">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 border-b border-funnel-border/50 bg-funnel-bg-elevated/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href={`/webinar/${webinar.slug}`}
            className="group inline-flex items-center gap-2 text-sm text-funnel-text-secondary transition-colors hover:text-funnel-text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>

          <h1 className="max-w-md truncate text-sm font-medium text-funnel-text-primary sm:max-w-lg sm:text-base">
            {webinar.title}
          </h1>

          {isLive && <LiveIndicator />}
          {isEnded && (
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-funnel-text-secondary ring-1 ring-funnel-border">
              REPLAY
            </span>
          )}
        </div>
      </header>

      {/* Main Content - 70/30 Split */}
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* Video Section (70%) */}
          <div className="w-full lg:w-[70%]">
            <div className="relative overflow-hidden rounded-funnel-xl bg-black shadow-funnel-xl ring-1 ring-white/10">
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
                  videoType="youtube"
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

            {/* Video Info & Reactions */}
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-funnel-text-primary">
                  {webinar.title}
                </h2>
                <p className="mt-1 text-sm text-funnel-text-secondary">
                  {webinar.company.name}
                </p>
              </div>

              {/* Reactions */}
              {webinar.reactions_enabled && (isLive || isEnded) && (
                <ReactionBar onReaction={handleReaction} />
              )}
            </div>

            {/* CTA Section */}
            {webinar.cta_text && webinar.cta_url && (
              <div className="mt-6">
                <a
                  href={webinar.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="funnel-shimmer group inline-flex w-full items-center justify-center gap-2 rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow"
                >
                  {webinar.cta_text}
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            )}
          </div>

          {/* Interaction Panel (30%) */}
          <div className="h-[500px] w-full overflow-hidden rounded-funnel-xl border border-funnel-border/50 bg-funnel-bg-card/50 shadow-funnel-lg backdrop-blur-sm lg:h-[calc(100vh-8rem)] lg:w-[30%]">
            <InteractionPanel
              webinarId={webinar.id}
              registrationId={registration.id}
              chatEnabled={webinar.chat_enabled}
              qaEnabled={webinar.qa_enabled}
              pollsEnabled={webinar.polls_enabled}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
