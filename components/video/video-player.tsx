'use client';

import { useState, useCallback, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { VideoType } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as ComponentType<any>;

interface VideoPlayerProps {
  url: string;
  videoType: VideoType;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/**
 * Video Player
 * Wrapper around react-player for YouTube, Vimeo, and HLS streams
 */
export function VideoPlayer({
  url,
  onReady,
  onPlay,
  onPause,
  onEnded,
  autoplay = false,
  muted = false,
  controls = true,
}: VideoPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleReady = useCallback(() => {
    setIsReady(true);
    onReady?.();
  }, [onReady]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className="flex aspect-video items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-lg font-medium">Unable to load video</p>
          <p className="mt-1 text-sm text-gray-400">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        playing={autoplay}
        muted={muted}
        controls={controls}
        onReady={handleReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={handleError}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}

interface VideoPlayerWithControlsProps extends VideoPlayerProps {
  title?: string;
  isLive?: boolean;
}

/**
 * Video Player with Controls
 * Player with title bar and status badge
 */
export function VideoPlayerWithControls({
  title,
  isLive,
  ...playerProps
}: VideoPlayerWithControlsProps) {
  return (
    <div className="space-y-3">
      <VideoPlayer {...playerProps} />
      {(title || isLive !== undefined) && (
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {isLive !== undefined && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isLive
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isLive && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              )}
              {isLive ? 'LIVE' : 'REPLAY'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
