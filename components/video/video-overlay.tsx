"use client";

import { Loader2, Clock, Video } from "lucide-react";
import { CountdownTimer } from "@/components/funnel/countdown-timer";

interface VideoOverlayProps {
  variant: "starting-soon" | "ended" | "loading";
  startTime?: string;
  onCountdownComplete?: () => void;
  message?: string;
}

/**
 * Video Overlay
 * Premium overlays with glassmorphism for video states
 */
export function VideoOverlay({
  variant,
  startTime,
  onCountdownComplete,
  message,
}: VideoOverlayProps) {
  return (
    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-purple-500/10 blur-[80px]" />
      </div>

      {variant === "loading" && (
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-white/10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
          <p className="text-funnel-text-secondary">{message || "Loading..."}</p>
        </div>
      )}

      {variant === "starting-soon" && startTime && (
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
            <Clock className="h-8 w-8 text-indigo-400" />
          </div>
          <p className="mb-6 text-lg font-medium text-funnel-text-secondary">
            Starting in
          </p>
          <CountdownTimer
            targetDate={startTime}
            onComplete={onCountdownComplete}
          />
        </div>
      )}

      {variant === "ended" && (
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-white/10">
            <Video className="h-8 w-8 text-funnel-text-muted" />
          </div>
          <p className="text-xl font-semibold text-funnel-text-primary">
            Webinar Ended
          </p>
          <p className="mt-2 text-funnel-text-muted">
            {message || "Thank you for watching!"}
          </p>
        </div>
      )}
    </div>
  );
}

interface LiveIndicatorProps {
  viewerCount?: number;
}

/**
 * Live Indicator
 * Premium badge with pulsing animation
 */
export function LiveIndicator({ viewerCount }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-400 ring-1 ring-red-500/30">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        LIVE
      </span>

      {viewerCount !== undefined && viewerCount > 0 && (
        <span className="text-sm text-funnel-text-secondary">
          {viewerCount.toLocaleString()} {viewerCount === 1 ? "viewer" : "viewers"}
        </span>
      )}
    </div>
  );
}
