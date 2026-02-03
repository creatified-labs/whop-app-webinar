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
      return { success: false, error: 'Registration not found' };
    }

    // Check if there's already an active session
    const existingSession = await getActiveZoomSession(webinarId, registrationId);
    if (existingSession) {
      // Return existing session instead of creating duplicate
      return { success: true, data: existingSession };
    }

    // Create new session
    const session = await createZoomSession({
      webinar_id: webinarId,
      registration_id: registrationId,
    });

    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to track Zoom join:', error);
    return { success: false, error: 'Failed to track join' };
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
      return { success: false, error: 'No active session found' };
    }

    // End the session
    const session = await endZoomSession(activeSession.id);

    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to track Zoom leave:', error);
    return { success: false, error: 'Failed to track leave' };
  }
}
