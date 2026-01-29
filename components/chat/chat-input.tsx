"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInput Component
 * Premium input with gradient send button
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(message.trim());
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  }, [message, onSend, isSending, disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = message.trim() && !isSending && !disabled;

  return (
    <div className="flex items-center gap-2 border-t border-funnel-border/50 bg-funnel-bg-card/80 p-3 backdrop-blur-sm">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        className="flex-1 rounded-funnel-lg border border-funnel-border bg-funnel-bg-elevated/50 px-4 py-2.5 text-sm text-funnel-text-primary placeholder-funnel-text-muted transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        maxLength={500}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-funnel-lg transition-all duration-200 ${
          canSend
            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-funnel-glow"
            : "bg-zinc-800 text-funnel-text-muted"
        }`}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
