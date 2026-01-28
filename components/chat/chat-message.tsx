'use client';

import { formatDistanceToNow } from 'date-fns';
import type { ChatMessage } from '@/types/database';

interface ChatMessageProps {
  message: ChatMessage;
  senderName?: string;
  isOwn?: boolean;
  isPinned?: boolean;
}

/**
 * ChatMessage Component
 * Individual chat message bubble
 */
export function ChatMessageItem({
  message,
  senderName = 'Anonymous',
  isOwn = false,
  isPinned = false,
}: ChatMessageProps) {
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div
      className={`group flex gap-2 px-3 py-1.5 hover:bg-gray-50 ${
        isPinned ? 'bg-yellow-50' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          isOwn ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {senderName[0].toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-medium ${
              isOwn ? 'text-blue-600' : 'text-gray-900'
            }`}
          >
            {senderName}
          </span>
          <span className="text-xs text-gray-400">{timeAgo}</span>
          {isPinned && (
            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
              Pinned
            </span>
          )}
        </div>
        <p className="break-words text-sm text-gray-700">{message.message}</p>
      </div>
    </div>
  );
}
