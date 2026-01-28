'use client';

import { CountdownTimer } from '@/components/funnel/countdown-timer';

interface VideoOverlayProps {
  variant: 'starting-soon' | 'ended' | 'loading';
  startTime?: string;
  onCountdownComplete?: () => void;
  message?: string;
}

/**
 * Video Overlay
 * Overlays for various video states (starting soon, ended, loading)
 */
export function VideoOverlay({
  variant,
  startTime,
  onCountdownComplete,
  message,
}: VideoOverlayProps) {
  return (
    <div className="flex aspect-video items-center justify-center bg-gray-900 text-white">
      {variant === 'loading' && (
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="mt-4 text-gray-300">{message || 'Loading...'}</p>
        </div>
      )}

      {variant === 'starting-soon' && startTime && (
        <div className="text-center">
          <p className="mb-4 text-lg font-medium text-gray-300">Starting in</p>
          <CountdownTimer
            targetDate={startTime}
            onComplete={onCountdownComplete}
          />
        </div>
      )}

      {variant === 'ended' && (
        <div className="text-center">
          <p className="text-xl font-semibold">Webinar Ended</p>
          <p className="mt-2 text-gray-400">
            {message || 'Thank you for watching!'}
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
 * Badge showing live status and viewer count
 */
export function LiveIndicator({ viewerCount }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        LIVE
      </span>
      {viewerCount !== undefined && viewerCount > 0 && (
        <span className="text-sm text-gray-600">
          {viewerCount.toLocaleString()} {viewerCount === 1 ? 'viewer' : 'viewers'}
        </span>
      )}
    </div>
  );
}
