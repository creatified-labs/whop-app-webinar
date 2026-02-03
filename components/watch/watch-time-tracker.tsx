'use client';

import { useEffect, useRef, useCallback } from 'react';
import { startWatchSession, trackWatchProgress, stopWatchSession } from '@/app/actions/analytics';

interface WatchTimeTrackerProps {
  webinarId: string;
  registrationId: string;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total video duration in seconds */
  duration: number;
  /** Whether the video is currently playing */
  isPlaying: boolean;
  /** Callback when a milestone is reached */
  onMilestoneReached?: (milestone: number) => void;
  /** Update interval in milliseconds (default: 30000 = 30 seconds) */
  updateInterval?: number;
}

/**
 * Watch Time Tracker
 * Tracks video watch progress and milestones
 */
export function WatchTimeTracker({
  webinarId,
  registrationId,
  currentTime,
  duration,
  isPlaying,
  onMilestoneReached,
  updateInterval = 30000,
}: WatchTimeTrackerProps) {
  const sessionIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initSession = async () => {
      const result = await startWatchSession(webinarId, registrationId);
      if (result.success && result.data) {
        sessionIdRef.current = result.data.id;
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      if (sessionIdRef.current) {
        stopWatchSession(sessionIdRef.current).catch(console.error);
      }
    };
  }, [webinarId, registrationId]);

  // Update progress periodically while playing
  const updateProgress = useCallback(async () => {
    if (!sessionIdRef.current || !isPlaying || duration <= 0) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < updateInterval) return;

    lastUpdateRef.current = now;

    const result = await trackWatchProgress(
      sessionIdRef.current,
      Math.floor(currentTime),
      Math.floor(duration)
    );

    if (result.success && result.data?.newMilestones) {
      result.data.newMilestones.forEach((milestone) => {
        onMilestoneReached?.(milestone);
      });
    }
  }, [currentTime, duration, isPlaying, updateInterval, onMilestoneReached]);

  // Track progress periodically
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(updateProgress, updateInterval);
    return () => clearInterval(interval);
  }, [isPlaying, updateProgress, updateInterval]);

  // Also update on significant time changes
  useEffect(() => {
    updateProgress();
  }, [Math.floor(currentTime / 60)]); // Update every minute of playback

  // End session when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable unload tracking
        navigator.sendBeacon?.(
          `/api/analytics/end-session?sessionId=${sessionIdRef.current}`
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Hook for watch time tracking
 * Alternative to the component for more control
 */
export function useWatchTimeTracker({
  webinarId,
  registrationId,
  updateInterval = 30000,
}: {
  webinarId: string;
  registrationId: string;
  updateInterval?: number;
}) {
  const sessionIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Start session
  const startSession = useCallback(async () => {
    const result = await startWatchSession(webinarId, registrationId);
    if (result.success && result.data) {
      sessionIdRef.current = result.data.id;
      return result.data;
    }
    return null;
  }, [webinarId, registrationId]);

  // Update progress
  const updateProgress = useCallback(async (
    currentSeconds: number,
    totalSeconds: number
  ) => {
    if (!sessionIdRef.current || totalSeconds <= 0) return null;

    const now = Date.now();
    if (now - lastUpdateRef.current < updateInterval) return null;

    lastUpdateRef.current = now;

    const result = await trackWatchProgress(
      sessionIdRef.current,
      Math.floor(currentSeconds),
      Math.floor(totalSeconds)
    );

    if (result.success && result.data) {
      return result.data.newMilestones;
    }
    return null;
  }, [updateInterval]);

  // End session
  const endSession = useCallback(async () => {
    if (sessionIdRef.current) {
      await stopWatchSession(sessionIdRef.current);
      sessionIdRef.current = null;
    }
  }, []);

  return {
    startSession,
    updateProgress,
    endSession,
    sessionId: sessionIdRef.current,
  };
}
