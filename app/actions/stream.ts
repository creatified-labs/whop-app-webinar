'use server';

/**
 * Stream Server Actions
 * Server-side actions for Mux live streaming management
 */

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { whopsdk } from '@/lib/whop-sdk';
import {
  getWebinarById,
  checkCompanyRole,
  updateWebinar as updateWebinarData,
} from '@/lib/data';
import {
  createLiveStream,
  getPlaybackUrl,
  enableLiveStream,
  disableLiveStream,
} from '@/lib/integrations/mux/client';
import type { Webinar, StreamStatus } from '@/types/database';
import type { ApiResponse } from '@/types';

/**
 * Verify the current user has access to a webinar for streaming operations
 */
async function verifyWebinarStreamAccess(
  webinarId: string
): Promise<{ webinar: Webinar; userId: string }> {
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    throw new Error('Webinar not found');
  }

  const headersList = await headers();
  const { userId: whopUserId } = await whopsdk.verifyUserToken(headersList);

  // Get user and verify access
  const { getOrCreateUser } = await import('@/lib/data/users');
  const user = await whopsdk.users.retrieve(whopUserId);
  const dbUser = await getOrCreateUser({
    id: user.id,
    email: null,
    name: user.name ?? null,
    username: user.username ?? null,
    profile_pic_url: user.profile_picture?.url ?? null,
  });

  const hasRole = await checkCompanyRole(webinar.company_id, dbUser.id, 'admin');
  if (!hasRole) {
    throw new Error('You do not have permission to manage this webinar');
  }

  return { webinar, userId: dbUser.id };
}

export interface SetupStreamResult {
  streamKey: string;
  playbackUrl: string;
}

/**
 * Setup a Mux live stream for a webinar
 * Creates a new Mux stream and saves the credentials to the webinar
 */
export async function setupStream(
  webinarId: string
): Promise<ApiResponse<SetupStreamResult>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarStreamAccess(webinarId);

    // Check if stream already exists
    if (webinar.stream_key) {
      return {
        data: {
          streamKey: webinar.stream_key,
          playbackUrl: webinar.mux_playback_id
            ? getPlaybackUrl(webinar.mux_playback_id)
            : '',
        },
        error: null,
        success: true,
      };
    }

    // Create new Mux live stream
    const { streamId, streamKey, playbackId } = await createLiveStream();
    const playbackUrl = getPlaybackUrl(playbackId);

    // Update webinar with stream details
    await updateWebinarData(webinarId, {
      mux_stream_id: streamId,
      stream_key: streamKey,
      mux_playback_id: playbackId,
      video_url: playbackUrl, // Set video_url to the HLS playback URL
      stream_status: 'idle' as StreamStatus,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return {
      data: { streamKey, playbackUrl },
      error: null,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to setup stream';
    return { data: null, error: message, success: false };
  }
}

/**
 * Update the stream status for a webinar
 */
async function updateStreamStatus(
  webinarId: string,
  streamStatus: StreamStatus
): Promise<Webinar> {
  return updateWebinarData(webinarId, { stream_status: streamStatus });
}

/**
 * Start streaming (mark webinar as live)
 * Called when host begins broadcasting via OBS
 */
export async function startStream(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarStreamAccess(webinarId);

    // Verify stream is setup
    if (!webinar.mux_stream_id) {
      throw new Error('Stream not configured. Please set up the stream first.');
    }

    // Enable the stream if it was disabled
    if (webinar.stream_status === 'ended') {
      await enableLiveStream(webinar.mux_stream_id);
    }

    // Update webinar status to live and stream status to live
    const updatedWebinar = await updateWebinarData(webinarId, {
      status: 'live',
      stream_status: 'live' as StreamStatus,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);
    revalidatePath(`/webinar/${webinar.slug}/watch`);

    return { data: updatedWebinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start stream';
    return { data: null, error: message, success: false };
  }
}

/**
 * End streaming (mark webinar as ended)
 * Called when host stops broadcasting
 */
export async function endStream(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarStreamAccess(webinarId);

    // Disable the Mux stream (stops accepting new RTMP connections)
    if (webinar.mux_stream_id) {
      try {
        await disableLiveStream(webinar.mux_stream_id);
      } catch {
        // Stream might already be disabled, continue anyway
        console.warn('Failed to disable Mux stream, continuing...');
      }
    }

    // Update webinar status to ended and stream status to ended
    const updatedWebinar = await updateWebinarData(webinarId, {
      status: 'ended',
      stream_status: 'ended' as StreamStatus,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);
    revalidatePath(`/webinar/${webinar.slug}/watch`);

    return { data: updatedWebinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end stream';
    return { data: null, error: message, success: false };
  }
}

/**
 * Reconnect stream (re-enable after ending)
 */
export async function reconnectStream(webinarId: string): Promise<ApiResponse<Webinar>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarStreamAccess(webinarId);

    // Re-enable the Mux stream
    if (webinar.mux_stream_id) {
      await enableLiveStream(webinar.mux_stream_id);
    }

    // Update status back to idle (ready to go live again)
    const updatedWebinar = await updateWebinarData(webinarId, {
      stream_status: 'idle' as StreamStatus,
    });

    revalidatePath(`/dashboard/[companyId]/webinars/${webinarId}`);

    return { data: updatedWebinar, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reconnect stream';
    return { data: null, error: message, success: false };
  }
}

/**
 * Get stream info for display in broadcast studio
 */
export interface StreamInfo {
  streamKey: string | null;
  rtmpUrl: string;
  playbackUrl: string | null;
  status: StreamStatus | null;
}

export async function getStreamInfo(webinarId: string): Promise<ApiResponse<StreamInfo>> {
  try {
    // Verify access
    const { webinar } = await verifyWebinarStreamAccess(webinarId);

    const { getRtmpUrl } = await import('@/lib/integrations/mux/client');

    return {
      data: {
        streamKey: webinar.stream_key,
        rtmpUrl: getRtmpUrl(),
        playbackUrl: webinar.mux_playback_id
          ? getPlaybackUrl(webinar.mux_playback_id)
          : null,
        status: webinar.stream_status,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stream info';
    return { data: null, error: message, success: false };
  }
}
