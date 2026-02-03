'use server';

import {
  createZoomSession,
  endZoomSession,
  getActiveZoomSession,
} from '@/lib/data/zoom-sessions';
import { getRegistrationById } from '@/lib/data/registrations';
import type { ApiResponse } from '@/types';
import type { ZoomSession } from '@/types/database';

/**
 * Track when a user joins a Zoom meeting
 */
export async function trackZoomJoin(
  webinarId: string,
  registrationId: string
): Promise<ApiResponse<ZoomSession>> {
  try {
    // Verify registration exists
    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      return { success: false, error: 'Registration not found', data: null };
    }

    // Check if there's already an active session
    const existingSession = await getActiveZoomSession(webinarId, registrationId);
    if (existingSession) {
      // Return existing session instead of creating duplicate
      return { success: true, data: existingSession, error: null };
    }

    // Create new session
    const session = await createZoomSession({
      webinar_id: webinarId,
      registration_id: registrationId,
      joined_at: new Date().toISOString(),
    });

    return { success: true, data: session, error: null };
  } catch (error) {
    console.error('Failed to track Zoom join:', error);
    return { success: false, error: 'Failed to track join', data: null };
  }
}

/**
 * Track when a user leaves a Zoom meeting
 */
export async function trackZoomLeave(
  webinarId: string,
  registrationId: string
): Promise<ApiResponse<ZoomSession>> {
  try {
    // Find the active session
    const activeSession = await getActiveZoomSession(webinarId, registrationId);
    if (!activeSession) {
      return { success: false, error: 'No active session found', data: null };
    }

    // End the session
    const session = await endZoomSession(activeSession.id);

    return { success: true, data: session, error: null };
  } catch (error) {
    console.error('Failed to track Zoom leave:', error);
    return { success: false, error: 'Failed to track leave', data: null };
  }
}
