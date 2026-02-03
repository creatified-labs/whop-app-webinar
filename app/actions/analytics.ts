'use server';

/**
 * Analytics Server Actions
 * Server-side actions for tracking engagement and watch time
 */

import {
  trackEngagementEvent,
  getOrCreateWatchSession,
  updateWatchProgress,
  endWatchSession,
  calculateLeadScore,
} from '@/lib/data';
import type { WatchSession, EngagementEvent, EngagementEventType } from '@/types/database';
import type { ApiResponse } from '@/types';

// ============================================
// Watch Time Tracking
// ============================================

/**
 * Start or get existing watch session
 */
export async function startWatchSession(
  webinarId: string,
  registrationId: string
): Promise<ApiResponse<WatchSession>> {
  try {
    const session = await getOrCreateWatchSession(webinarId, registrationId);
    return {
      data: session,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to start watch session',
      success: false,
    };
  }
}

/**
 * Update watch progress and check for milestones
 */
export async function trackWatchProgress(
  sessionId: string,
  currentSeconds: number,
  totalDurationSeconds: number
): Promise<ApiResponse<{ session: WatchSession; newMilestones: number[] }>> {
  try {
    const result = await updateWatchProgress(sessionId, currentSeconds, totalDurationSeconds);

    // If new milestones were reached, recalculate lead score
    if (result.newMilestones.length > 0) {
      // Get registration ID from session to recalculate lead score
      // This is done asynchronously - we don't need to wait
      calculateLeadScore(result.session.registration_id).catch(console.error);
    }

    return {
      data: result,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update watch progress',
      success: false,
    };
  }
}

/**
 * End a watch session
 */
export async function stopWatchSession(
  sessionId: string
): Promise<ApiResponse<WatchSession>> {
  try {
    const session = await endWatchSession(sessionId);
    return {
      data: session,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to end watch session',
      success: false,
    };
  }
}

// ============================================
// Engagement Tracking
// ============================================

/**
 * Track an engagement event
 */
export async function trackEngagement(
  webinarId: string,
  registrationId: string,
  eventType: EngagementEventType,
  eventData?: Record<string, unknown>
): Promise<ApiResponse<EngagementEvent>> {
  try {
    const event = await trackEngagementEvent(
      webinarId,
      registrationId,
      eventType,
      eventData
    );

    // Recalculate lead score after engagement (async)
    calculateLeadScore(registrationId).catch(console.error);

    return {
      data: event,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to track engagement',
      success: false,
    };
  }
}

/**
 * Track CTA click
 */
export async function trackCtaClick(
  webinarId: string,
  registrationId: string,
  ctaUrl?: string
): Promise<ApiResponse<EngagementEvent>> {
  return trackEngagement(webinarId, registrationId, 'cta_click', { url: ctaUrl });
}
