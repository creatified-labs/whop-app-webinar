import Mux from '@mux/mux-node';

// Initialize Mux client (only on server-side)
const getMuxClient = () => {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set');
  }

  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });
};

export interface CreateLiveStreamResult {
  streamId: string;
  streamKey: string;
  playbackId: string;
}

/**
 * Create a new Mux live stream
 * Returns stream credentials for RTMP ingestion
 */
export async function createLiveStream(): Promise<CreateLiveStreamResult> {
  const mux = getMuxClient();

  const stream = await mux.video.liveStreams.create({
    playback_policy: ['public'],
    new_asset_settings: {
      playback_policy: ['public'],
    },
    reduced_latency: true,
  });

  if (!stream.id || !stream.stream_key || !stream.playback_ids?.[0]?.id) {
    throw new Error('Failed to create live stream - missing required fields');
  }

  return {
    streamId: stream.id,
    streamKey: stream.stream_key,
    playbackId: stream.playback_ids[0].id,
  };
}

export interface LiveStreamStatus {
  status: string;
  playbackId: string | null;
  activeAssetId: string | null;
}

/**
 * Get the current status of a live stream
 */
export async function getLiveStreamStatus(streamId: string): Promise<LiveStreamStatus> {
  const mux = getMuxClient();

  const stream = await mux.video.liveStreams.retrieve(streamId);

  return {
    status: stream.status || 'unknown',
    playbackId: stream.playback_ids?.[0]?.id || null,
    activeAssetId: stream.active_asset_id || null,
  };
}

/**
 * Disable (end) a live stream
 * This stops accepting new RTMP connections
 */
export async function disableLiveStream(streamId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.liveStreams.disable(streamId);
}

/**
 * Enable a live stream (re-enable after disabling)
 */
export async function enableLiveStream(streamId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.liveStreams.enable(streamId);
}

/**
 * Delete a live stream completely
 */
export async function deleteLiveStream(streamId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.liveStreams.delete(streamId);
}

/**
 * Get the HLS playback URL for a stream
 */
export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

/**
 * Get the RTMP ingest URL for Mux
 * Hosts will use this with their stream key in OBS or other streaming software
 */
export function getRtmpUrl(): string {
  return 'rtmps://global-live.mux.com:443/app';
}

/**
 * Get the SRT ingest URL (alternative to RTMP)
 */
export function getSrtUrl(streamKey: string): string {
  return `srt://global-live.mux.com:5000?streamid=${streamKey}`;
}

/**
 * Get the WHIP ingest URL for browser-based streaming
 * Allows streaming directly from the browser using WebRTC
 */
export function getWhipUrl(streamKey: string): string {
  return `https://global-live.mux.com/v1/whip/${streamKey}`;
}
