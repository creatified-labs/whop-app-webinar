'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseChatOptions {
  webinarId: string;
  registrationId: string;
  initialMessages?: ChatMessage[];
}

interface ChatMessageWithSender extends ChatMessage {
  sender_name?: string;
}

export function useRealtimeChat({
  webinarId,
  registrationId,
  initialMessages = [],
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${webinarId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Only add if not hidden
          if (!newMessage.is_hidden) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages((prev) =>
            prev
              .map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
              .filter((msg) => !msg.is_hidden)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [webinarId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isSending) return;

      setIsSending(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.from('chat_messages').insert({
          webinar_id: webinarId,
          registration_id: registrationId,
          message: message.trim(),
        });

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [webinarId, registrationId, isSending]
  );

  return {
    messages,
    isConnected,
    isSending,
    sendMessage,
  };
}
