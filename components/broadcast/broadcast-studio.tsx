'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button, Text } from '@whop/react/components';
import { Video, Mic, Monitor, VideoOff, MicOff, Copy, Check, Radio, Square, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MediaPreview } from './media-preview';
import { StreamControls } from './stream-controls';
import { useWhipStream, type WhipStreamStatus } from '@/hooks/use-whip-stream';
import { startStream, endStream } from '@/app/actions/stream';
import type { StreamStatus } from '@/types/database';

interface BroadcastStudioProps {
  webinarId: string;
  webinarTitle: string;
  streamKey: string;
  rtmpUrl: string;
  whipUrl: string;
  streamStatus: StreamStatus | null;
}

/**
 * Broadcast Studio
 * Full broadcasting interface for hosts
 */
export function BroadcastStudio({
  webinarId,
  webinarTitle,
  streamKey,
  rtmpUrl,
  whipUrl,
  streamStatus,
}: BroadcastStudioProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'rtmp' | 'key' | null>(null);
  const [streamMode, setStreamMode] = useState<'browser' | 'obs'>('browser');
  const router = useRouter();

  // WHIP streaming hook for browser-based streaming
  const {
    status: whipStatus,
    error: whipError,
    startStreaming,
    stopStreaming,
  } = useWhipStream({
    whipUrl,
    onError: (err) => setError(err),
  });

  const isBrowserStreaming = whipStatus === 'live' || whipStatus === 'connecting';

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: 'user' },
        audio: true,
      });
      setStream(mediaStream);
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true,
      });
      setStream(mediaStream);

      // Handle when user stops sharing via browser UI
      mediaStream.getVideoTracks()[0].onended = () => {
        setStream(null);
      };
    } catch (err) {
      setError('Failed to start screen share. Please check permissions.');
      console.error('Screen share error:', err);
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [stream, isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [stream, isAudioEnabled]);

  const copyToClipboard = useCallback(async (text: string, field: 'rtmp' | 'key') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  }, []);

  // Start browser-based streaming via WHIP
  const handleStartBrowserStream = useCallback(async () => {
    if (!stream) {
      setError('Please select a camera or screen first');
      return;
    }
    setError(null);
    const success = await startStreaming(stream);
    if (success) {
      // Update webinar status to live
      const result = await startStream(webinarId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Failed to update stream status');
      }
    }
  }, [stream, startStreaming, webinarId, router]);

  // Stop browser-based streaming
  const handleStopBrowserStream = useCallback(async () => {
    stopStreaming();
    // Update webinar status to ended
    const result = await endStream(webinarId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to update stream status');
    }
  }, [stopStreaming, webinarId, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-12">Broadcast Studio</h1>
          <Text color="gray" size="2">
            {webinarTitle}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          {/* Browser Stream Status */}
          {whipStatus === 'live' && (
            <div className="flex items-center gap-2 text-red-500">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="font-medium">LIVE (Browser)</span>
            </div>
          )}
          {whipStatus === 'connecting' && (
            <div className="flex items-center gap-2 text-blue-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Connecting...</span>
            </div>
          )}
          {/* Only show StreamControls for OBS mode when not browser streaming */}
          {streamMode === 'obs' && !isBrowserStreaming && (
            <StreamControls
              webinarId={webinarId}
              streamStatus={streamStatus}
              hasMediaStream={!!stream}
            />
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 rounded-lg bg-gray-a2 p-1">
        <button
          onClick={() => setStreamMode('browser')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            streamMode === 'browser'
              ? 'bg-white text-gray-12 shadow-sm dark:bg-gray-a4'
              : 'text-gray-11 hover:text-gray-12'
          }`}
        >
          Stream from Browser
        </button>
        <button
          onClick={() => setStreamMode('obs')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            streamMode === 'obs'
              ? 'bg-white text-gray-12 shadow-sm dark:bg-gray-a4'
              : 'text-gray-11 hover:text-gray-12'
          }`}
        >
          Stream via OBS
        </button>
      </div>

      {/* Video Preview */}
      <div className="rounded-lg border border-gray-a4 bg-gray-a2 p-4">
        <MediaPreview stream={stream} />

        {/* Media Controls */}
        {stream && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isVideoEnabled ? 'solid' : 'soft'}
                onClick={toggleVideo}
                size="2"
                disabled={isBrowserStreaming}
              >
                {isVideoEnabled ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
                {isVideoEnabled ? 'Video On' : 'Video Off'}
              </Button>
              <Button
                variant={isAudioEnabled ? 'solid' : 'soft'}
                onClick={toggleAudio}
                size="2"
                disabled={isBrowserStreaming}
              >
                {isAudioEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
                {isAudioEnabled ? 'Mic On' : 'Mic Off'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* Browser Streaming Controls */}
              {streamMode === 'browser' && (
                <>
                  {whipStatus === 'live' ? (
                    <Button
                      size="2"
                      color="red"
                      variant="soft"
                      onClick={handleStopBrowserStream}
                    >
                      <Square className="h-4 w-4" />
                      End Stream
                    </Button>
                  ) : (
                    <Button
                      size="2"
                      color="red"
                      onClick={handleStartBrowserStream}
                      disabled={whipStatus === 'connecting'}
                    >
                      {whipStatus === 'connecting' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Radio className="h-4 w-4" />
                      )}
                      {whipStatus === 'connecting' ? 'Connecting...' : 'Go Live'}
                    </Button>
                  )}
                </>
              )}
              {!isBrowserStreaming && (
                <Button variant="soft" color="gray" onClick={stopMedia} size="2">
                  Stop Preview
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Source Selection */}
        {!stream && (
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={startCamera} size="2">
              <Video className="h-4 w-4" />
              Use Camera
            </Button>
            <Button onClick={startScreenShare} variant="soft" size="2">
              <Monitor className="h-4 w-4" />
              Share Screen
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* RTMP Credentials - Only show in OBS mode */}
      {streamMode === 'obs' && (
      <div className="rounded-lg border border-gray-a4 bg-gray-a2 p-4">
        <h3 className="font-medium text-gray-12 mb-3">Stream via OBS or Streaming Software</h3>

        <div className="space-y-3">
          {/* RTMP URL */}
          <div>
            <label className="block text-sm font-medium text-gray-11 mb-1">
              RTMP URL
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-a3 px-3 py-2 text-sm font-mono text-gray-12 break-all">
                {rtmpUrl}
              </code>
              <Button
                variant="soft"
                size="1"
                onClick={() => copyToClipboard(rtmpUrl, 'rtmp')}
              >
                {copiedField === 'rtmp' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Stream Key */}
          <div>
            <label className="block text-sm font-medium text-gray-11 mb-1">
              Stream Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-a3 px-3 py-2 text-sm font-mono text-gray-12 break-all">
                {streamKey}
              </code>
              <Button
                variant="soft"
                size="1"
                onClick={() => copyToClipboard(streamKey, 'key')}
              >
                {copiedField === 'key' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <strong>How to stream:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Open OBS Studio or your streaming software</li>
            <li>Go to Settings &rarr; Stream</li>
            <li>Select &quot;Custom&quot; as the service</li>
            <li>Paste the RTMP URL and Stream Key above</li>
            <li>Click &quot;Start Streaming&quot; in OBS, then click &quot;Go Live&quot; here</li>
          </ol>
        </div>
      </div>
      )}

      {/* Browser Streaming Info - Only show in browser mode */}
      {streamMode === 'browser' && (
        <div className="rounded-lg border border-gray-a4 bg-gray-a2 p-4">
          <h3 className="font-medium text-gray-12 mb-3">Stream from Your Browser</h3>
          <div className="rounded bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <strong>How to stream:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Click &quot;Use Camera&quot; or &quot;Share Screen&quot; above</li>
              <li>Grant permissions when prompted</li>
              <li>Adjust your video and audio as needed</li>
              <li>Click &quot;Go Live&quot; to start streaming</li>
            </ol>
          </div>
          {whipError && (
            <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {whipError}
            </div>
          )}
        </div>
      )}

      {/* Stream Status */}
      {streamStatus && (
        <div className="rounded-lg border border-gray-a4 bg-gray-a2 p-4">
          <h3 className="font-medium text-gray-12 mb-2">Stream Status</h3>
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                streamStatus === 'live'
                  ? 'bg-red-500 animate-pulse'
                  : streamStatus === 'idle'
                  ? 'bg-yellow-500'
                  : streamStatus === 'connecting'
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
            />
            <span className="text-sm text-gray-11 capitalize">{streamStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
}
