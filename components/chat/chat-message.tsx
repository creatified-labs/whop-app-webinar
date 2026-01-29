"use client";

import { formatDistanceToNow } from "date-fns";
import { Pin } from "lucide-react";
import type { ChatMessage } from "@/types/database";

interface ChatMessageProps {
  message: ChatMessage;
  senderName?: string;
  isOwn?: boolean;
  isPinned?: boolean;
}

/**
 * ChatMessage Component
 * Premium message with gradient avatar and pinned highlight
 */
export function ChatMessageItem({
  message,
  senderName = "Anonymous",
  isOwn = false,
  isPinned = false,
}: ChatMessageProps) {
  const timeAgo = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={`group flex gap-3 px-3 py-2 transition-colors hover:bg-white/5 ${
        isPinned ? "bg-amber-500/10" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          isOwn
            ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white ring-2 ring-indigo-500/30"
            : "bg-zinc-800 text-funnel-text-secondary ring-1 ring-funnel-border"
        }`}
      >
        {senderName[0].toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-medium ${
              isOwn ? "text-indigo-400" : "text-funnel-text-primary"
            }`}
          >
            {senderName}
          </span>
          <span className="text-xs text-funnel-text-muted">{timeAgo}</span>
          {isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
        </div>
        <p className="mt-0.5 break-words text-sm leading-relaxed text-funnel-text-secondary">
          {message.message}
        </p>
      </div>
    </div>
  );
}
