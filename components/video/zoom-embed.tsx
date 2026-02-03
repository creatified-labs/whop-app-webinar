'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Video } from 'lucide-react';

interface ZoomEmbedProps {
  meetingNumber: string;
  password: string;
  userName: string;
  userEmail?: string;
  signature: string;
  onJoin?: () => void;
  onLeave?: () => void;
  onError?: (error: string) => void;
}

type ZoomStatus = 'loading' | 'initializing' | 'joining' | 'joined' | 'error';

/**
 * ZoomEmbed Component
 * Embeds a Zoom meeting using the Zoom Meeting SDK
 * Attendees join as view-only participants
 */
export function ZoomEmbed({
  meetingNumber,
  password,
  userName,
  userEmail,
  signature,
  onJoin,
  onLeave,
  onError,
}: ZoomEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const [status, setStatus] = useState<ZoomStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const handleError = useCallback((message: string) => {
    setStatus('error');
    setErrorMessage(message);
    onError?.(message);
  }, [onError]);

  useEffect(() => {
    // Prevent double initialization in React strict mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY;
    if (!sdkKey) {
      handleError('Zoom SDK key not configured');
      return;
    }

    let isMounted = true;

    const initZoom = async () => {
      try {
        setStatus('initializing');

        // Dynamically import Zoom SDK to avoid SSR issues
        const { ZoomMtg } = await import('@zoom/meetingsdk');

        if (!isMounted) return;

        // Preload Zoom resources
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Set the language
        ZoomMtg.i18n.load('en-US');
        ZoomMtg.i18n.reload('en-US');

        // Initialize the SDK
        ZoomMtg.init({
          leaveUrl: window.location.href,
          disablePreview: true,
          disableInvite: true,
          disableRecord: true,
          disableJoinAudio: false,
          audioPanelAlwaysOpen: false,
          isSupportAV: true,
          success: () => {
            if (!isMounted) return;

            setStatus('joining');

            // Clean the meeting number (remove spaces/dashes)
            const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, '');

            // Join the meeting
            ZoomMtg.join({
              sdkKey,
              signature,
              meetingNumber: cleanMeetingNumber,
              passWord: password,
              userName,
              userEmail: userEmail || '',
              success: () => {
                if (!isMounted) return;
                setStatus('joined');
                onJoin?.();
                clientRef.current = ZoomMtg;
              },
              error: (err: any) => {
                console.error('Zoom join error:', err);
                handleError(getZoomErrorMessage(err));
              },
            });
          },
          error: (err: any) => {
            console.error('Zoom init error:', err);
            handleError('Failed to initialize Zoom');
          },
        });
      } catch (err) {
        console.error('Zoom SDK load error:', err);
        if (isMounted) {
          handleError('Failed to load Zoom SDK. Please check your connection.');
        }
      }
    };

    initZoom();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (clientRef.current) {
        try {
          clientRef.current.leaveMeeting({});
          onLeave?.();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [meetingNumber, password, userName, userEmail, signature, onJoin, onLeave, handleError]);

  // Error state
  if (status === 'error') {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 bg-black p-8 text-center">
        <div className="rounded-full bg-red-500/20 p-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="text-lg font-medium text-white">Unable to join meeting</p>
          <p className="mt-1 text-sm text-gray-400">{errorMessage}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Loading/Joining state
  if (status !== 'joined') {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 bg-black p-8">
        <div className="relative">
          <div className="rounded-full bg-indigo-500/20 p-4">
            <Video className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="absolute -bottom-1 -right-1">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-white">
            {status === 'loading' && 'Loading Zoom...'}
            {status === 'initializing' && 'Initializing meeting...'}
            {status === 'joining' && 'Joining meeting...'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Please wait while we connect you
          </p>
        </div>
      </div>
    );
  }

  // The Zoom SDK renders into #zmmtg-root automatically
  // We just need to provide the container
  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full bg-black"
    >
      {/* Zoom SDK renders here via #zmmtg-root in document body */}
    </div>
  );
}

/**
 * Convert Zoom error codes to human-readable messages
 */
function getZoomErrorMessage(error: any): string {
  const code = error?.errorCode || error?.code;

  switch (code) {
    case 1:
      return 'Invalid meeting number';
    case 2:
      return 'Meeting has ended';
    case 3:
      return 'Invalid meeting password';
    case 4:
      return 'Meeting is not started yet';
    case 5:
      return 'Meeting host has not joined';
    case 6:
      return 'You have been removed from the meeting';
    case 7:
      return 'Meeting is locked';
    case 8:
      return 'Meeting is full';
    case 9:
      return 'Webinar registration required';
    case 10:
      return 'Meeting requires authentication';
    default:
      return error?.message || 'Failed to join meeting';
  }
}

/**
 * ZoomEmbedFallback Component
 * Shown when Zoom SDK is not available or user prefers external
 */
export function ZoomEmbedFallback({
  joinUrl,
  meetingId,
}: {
  joinUrl?: string;
  meetingId?: string;
}) {
  const url = joinUrl || (meetingId ? `https://zoom.us/j/${meetingId.replace(/[\s-]/g, '')}` : null);

  if (!url) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center bg-black">
        <p className="text-gray-400">No meeting link available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-6 bg-black p-8 text-center">
      <div className="rounded-full bg-blue-500/20 p-6">
        <Video className="h-12 w-12 text-blue-400" />
      </div>
      <div>
        <p className="text-xl font-medium text-white">Join via Zoom</p>
        <p className="mt-2 text-sm text-gray-400">
          Click the button below to join the meeting in a new tab
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Video className="h-5 w-5" />
        Open in Zoom
      </a>
      <p className="text-xs text-gray-500">
        The meeting will open in a new browser tab
      </p>
    </div>
  );
}
