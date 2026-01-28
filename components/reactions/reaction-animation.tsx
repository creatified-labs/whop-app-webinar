'use client';

import { useEffect, useState } from 'react';

interface FloatingReaction {
  key: string;
  emoji: string;
}

interface ReactionAnimationProps {
  reactions: FloatingReaction[];
}

/**
 * ReactionAnimation Component
 * Displays floating emoji reactions
 */
export function ReactionAnimation({ reactions }: ReactionAnimationProps) {
  return (
    <div className="pointer-events-none fixed bottom-24 left-4 h-64 w-16 overflow-hidden">
      {reactions.map((reaction) => (
        <FloatingEmoji key={reaction.key} emoji={reaction.emoji} />
      ))}
    </div>
  );
}

interface FloatingEmojiProps {
  emoji: string;
}

function FloatingEmoji({ emoji }: FloatingEmojiProps) {
  const [style, setStyle] = useState({
    transform: 'translateY(0) scale(1)',
    opacity: 1,
  });

  useEffect(() => {
    // Random horizontal offset
    const xOffset = Math.random() * 40 - 20;

    // Start animation after mount
    requestAnimationFrame(() => {
      setStyle({
        transform: `translateY(-200px) translateX(${xOffset}px) scale(0.5)`,
        opacity: 0,
      });
    });
  }, []);

  return (
    <span
      className="absolute bottom-0 left-1/2 text-3xl transition-all duration-[2000ms] ease-out"
      style={{
        ...style,
        marginLeft: '-0.5em',
      }}
    >
      {emoji}
    </span>
  );
}
