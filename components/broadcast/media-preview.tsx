'use client';

import { useRef, useEffect } from 'react';
import { Video } from 'lucide-react';

interface MediaPreviewProps {
  stream: MediaStream | null;
}

/**
 * Media Preview Component
 * Shows a live preview of camera or screen share
 */
export function MediaPreview({ stream }: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="aspect-video w-full rounded-lg bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a video source to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-contain"
      />
    </div>
  );
}
