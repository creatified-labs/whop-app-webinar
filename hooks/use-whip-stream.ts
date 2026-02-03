'use client';

import { useState, useCallback, useRef } from 'react';

export type WhipStreamStatus = 'idle' | 'connecting' | 'live' | 'error' | 'ended';

interface UseWhipStreamOptions {
  whipUrl: string;
  onStatusChange?: (status: WhipStreamStatus) => void;
  onError?: (error: string) => void;
}

interface UseWhipStreamReturn {
  status: WhipStreamStatus;
  error: string | null;
  startStreaming: (stream: MediaStream) => Promise<boolean>;
  stopStreaming: () => void;
}

/**
 * Hook for browser-based streaming via WHIP (WebRTC-HTTP Ingestion Protocol)
 * Sends MediaStream directly to Mux without needing OBS
 */
export function useWhipStream({
  whipUrl,
  onStatusChange,
  onError,
}: UseWhipStreamOptions): UseWhipStreamReturn {
  const [status, setStatus] = useState<WhipStreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const resourceUrlRef = useRef<string | null>(null);

  const updateStatus = useCallback(
    (newStatus: WhipStreamStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  const handleError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
      updateStatus('error');
      onError?.(errorMessage);
    },
    [onError, updateStatus]
  );

  const startStreaming = useCallback(
    async (stream: MediaStream): Promise<boolean> => {
      try {
        setError(null);
        updateStatus('connecting');

        // Create peer connection with STUN servers
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
          // Mux prefers unified-plan
          // @ts-expect-error - sdpSemantics is valid but not in types
          sdpSemantics: 'unified-plan',
        });

        peerConnectionRef.current = pc;

        // Add all tracks from the MediaStream
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          switch (pc.connectionState) {
            case 'connected':
              updateStatus('live');
              break;
            case 'disconnected':
            case 'failed':
              handleError('Connection lost');
              break;
            case 'closed':
              updateStatus('ended');
              break;
          }
        };

        // Create and set local description (offer)
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE gathering to complete
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          } else {
            const checkState = () => {
              if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', checkState);
                resolve();
              }
            };
            pc.addEventListener('icegatheringstatechange', checkState);
          }
        });

        // Get the final local description with ICE candidates
        const localDescription = pc.localDescription;
        if (!localDescription) {
          throw new Error('Failed to create local description');
        }

        // Send offer to WHIP endpoint
        const response = await fetch(whipUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: localDescription.sdp,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`WHIP negotiation failed: ${response.status} - ${errorText}`);
        }

        // Store resource URL for later DELETE request
        const locationHeader = response.headers.get('Location');
        if (locationHeader) {
          resourceUrlRef.current = locationHeader;
        }

        // Get the answer SDP
        const answerSdp = await response.text();

        // Set remote description (answer)
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp,
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start streaming';
        handleError(message);
        return false;
      }
    },
    [whipUrl, updateStatus, handleError]
  );

  const stopStreaming = useCallback(() => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Send DELETE to resource URL if available (tells Mux to end the stream)
    if (resourceUrlRef.current) {
      fetch(resourceUrlRef.current, { method: 'DELETE' }).catch(() => {
        // Ignore errors on cleanup
      });
      resourceUrlRef.current = null;
    }

    updateStatus('ended');
  }, [updateStatus]);

  return {
    status,
    error,
    startStreaming,
    stopStreaming,
  };
}
