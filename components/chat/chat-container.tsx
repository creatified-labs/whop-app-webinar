'use client';

import { useRef, useEffect } from 'react';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';
import { ChatMessageItem } from './chat-message';
import { ChatInput } from './chat-input';
import type { ChatMessage } from '@/types/database';

interface ChatContainerProps {
  webinarId: string;
  registrationId: string;
  registrationName?: string;
  initialMessages?: ChatMessage[];
  disabled?: boolean;
}

/**
 * ChatContainer Component
 * Full chat interface with messages and input
 */
export function ChatContainer({
  webinarId,
  registrationId,
  registrationName = 'Anonymous',
  initialMessages = [],
  disabled = false,
}: ChatContainerProps) {
  const { messages, isConnected, sendMessage } = useRealtimeChat({
    webinarId,
    registrationId,
    initialMessages,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Connection status */}
      {!isConnected && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          Connecting to chat...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-sm text-gray-500">
              No messages yet. Be the first to say something!
            </p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                senderName={
                  message.registration_id === registrationId
                    ? registrationName
                    : 'Viewer'
                }
                isOwn={message.registration_id === registrationId}
                isPinned={message.is_pinned}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={disabled || !isConnected}
        placeholder={disabled ? 'Chat is disabled' : 'Type a message...'}
      />
    </div>
  );
}
