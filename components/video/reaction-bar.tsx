"use client";

import { useState, useCallback } from "react";
import { ALLOWED_REACTIONS } from "@/lib/validations/webinar";

interface ReactionBarProps {
  onReaction: (emoji: string) => void;
  disabled?: boolean;
}

/**
 * Reaction Bar
 * Premium compact pill with emoji buttons and scale effects
 */
export function ReactionBar({ onReaction, disabled }: ReactionBarProps) {
  const [cooldown, setCooldown] = useState<string | null>(null);

  const handleReaction = useCallback(
    (emoji: string) => {
      if (cooldown || disabled) return;

      onReaction(emoji);
      setCooldown(emoji);

      // 1 second cooldown per emoji
      setTimeout(() => {
        setCooldown(null);
      }, 1000);
    },
    [cooldown, disabled, onReaction]
  );

  return (
    <div className="flex items-center gap-1 rounded-full bg-zinc-800/80 p-1 ring-1 ring-white/10 backdrop-blur-sm">
      {ALLOWED_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          disabled={cooldown === emoji || disabled}
          className={`rounded-full p-2 text-xl transition-all duration-200 hover:scale-125 hover:bg-white/10 active:scale-95 ${
            cooldown === emoji ? "scale-90 opacity-50" : ""
          } ${disabled ? "cursor-not-allowed opacity-30" : ""}`}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

interface ReactionAnimationProps {
  emoji: string;
  id: string;
  onComplete: (id: string) => void;
}

/**
 * Reaction Animation
 * Enhanced floating emoji with rotation
 */
export function ReactionAnimation({
  emoji,
  id,
  onComplete,
}: ReactionAnimationProps) {
  return (
    <span
      className="pointer-events-none absolute animate-funnel-float-reaction text-3xl"
      style={{
        left: `${Math.random() * 70 + 15}%`,
        bottom: "10%",
      }}
      onAnimationEnd={() => onComplete(id)}
    >
      {emoji}
    </span>
  );
}

interface ReactionContainerProps {
  reactions: Array<{ id: string; emoji: string }>;
  onReactionComplete: (id: string) => void;
}

/**
 * Reaction Container
 * Container for floating reaction animations
 */
export function ReactionContainer({
  reactions,
  onReactionComplete,
}: ReactionContainerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {reactions.map((reaction) => (
        <ReactionAnimation
          key={reaction.id}
          id={reaction.id}
          emoji={reaction.emoji}
          onComplete={onReactionComplete}
        />
      ))}
    </div>
  );
}
