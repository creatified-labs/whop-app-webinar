"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { VideoPlayer, type VideoProgress } from "@/components/video/video-player";
import { WatchTimeTracker } from "@/components/watch/watch-time-tracker";
import { trackCtaClick } from "@/app/actions/analytics";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isLive = webinar.status === "live";
  const isEnded = webinar.status === "ended";
  const isScheduled = webinar.status === "scheduled";
  const isStreamLive = webinar.stream_status === "live";
  const isWaitingForStream = isLive && webinar.stream_status === "idle";

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

  // Handle video progress
  const handleProgress = useCallback((progress: VideoProgress) => {
    setCurrentTime(progress.playedSeconds);
  }, []);

  // Handle video duration
  const handleDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  // Handle play/pause
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle CTA click with tracking
  const handleCtaClick = useCallback(() => {
    trackCtaClick(webinar.id, registration.id, webinar.cta_url || undefined);
  }, [webinar.id, webinar.cta_url, registration.id]);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-funnel-bg-primary">
      {/* Compact Header */}
      <header className="z-50 glass-heavy shadow-glass-sm px-4 py-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/webinar/${webinar.slug}`}
            className="group inline-flex items-center gap-2 text-sm text-funnel-text-secondary transition-colors hover:text-funnel-text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <h1 className="max-w-md truncate text-sm font-medium text-funnel-text-primary sm:max-w-lg">
            {webinar.title}
          </h1>

          <div className="flex items-center gap-3">
            {isLive && <LiveIndicator />}
            {isEnded && (
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-funnel-text-secondary ring-1 ring-funnel-border">
                REPLAY
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Full Screen Content */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row">
        {/* Video Section (80%) */}
        <div className="flex min-h-0 flex-1 flex-col lg:w-[80%]">
          <div className="relative flex-1 overflow-hidden rounded-xl bg-black shadow-glass-lg ring-1 ring-white/10">
            {/* Video or Overlay */}
            {isScheduled && !hasWebinarStarted(webinar.scheduled_at) ? (
              <VideoOverlay
                variant="starting-soon"
                startTime={webinar.scheduled_at}
                onCountdownComplete={handleCountdownComplete}
              />
            ) : isWaitingForStream ? (
              <VideoOverlay
                variant="loading"
                message="The host is preparing to go live. Please wait..."
              />
            ) : isEnded && !videoUrl ? (
              <VideoOverlay
                variant="ended"
                message="Replay will be available soon."
              />
            ) : videoUrl ? (
              <>
                <VideoPlayer
                  url={videoUrl}
                  autoplay={isLive || isStreamLive}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                />
                <WatchTimeTracker
                  webinarId={webinar.id}
                  registrationId={registration.id}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                />
              </>
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

          {/* Compact Video Info Bar */}
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="truncate text-sm font-semibold text-funnel-text-primary">
                  {webinar.title}
                </h2>
                <span className="hidden text-xs text-funnel-text-secondary sm:inline">
                  {webinar.company.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reactions */}
              {webinar.reactions_enabled && (isLive || isEnded) && (
                <ReactionBar onReaction={handleReaction} />
              )}

              {/* CTA Button - Compact */}
              {webinar.cta_text && webinar.cta_url && (
                <a
                  href={webinar.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCtaClick}
                  className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow"
                >
                  {webinar.cta_text}
                  <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Interaction Panel (20%) - Collapsible on mobile */}
        <div className="h-[400px] w-full overflow-hidden rounded-xl glass-depth shadow-glass-lg lg:h-full lg:w-[20%] lg:min-w-[320px]">
          <InteractionPanel
            webinarId={webinar.id}
            registrationId={registration.id}
            chatEnabled={webinar.chat_enabled}
            qaEnabled={webinar.qa_enabled}
            pollsEnabled={webinar.polls_enabled}
          />
        </div>
      </div>
    </main>
  );
}
