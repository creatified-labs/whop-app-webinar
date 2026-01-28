'use client';

import { useRealtimeReactions } from '@/hooks/use-realtime-reactions';
import { ReactionAnimation } from './reaction-animation';

interface ReactionButtonsProps {
  webinarId: string;
  registrationId: string;
  disabled?: boolean;
}

/**
 * ReactionButtons Component
 * Emoji reaction buttons with floating animations
 */
export function ReactionButtons({
  webinarId,
  registrationId,
  disabled = false,
}: ReactionButtonsProps) {
  const {
    floatingReactions,
    isConnected,
    isSending,
    sendReaction,
    availableEmojis,
  } = useRealtimeReactions({
    webinarId,
    registrationId,
  });

  return (
    <>
      {/* Floating reactions */}
      <ReactionAnimation
        reactions={floatingReactions.map((r) => ({
          key: r.key,
          emoji: r.emoji,
        }))}
      />

      {/* Reaction buttons */}
      <div className="flex items-center gap-1">
        {availableEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            disabled={disabled || !isConnected || isSending}
            className="rounded-full p-2 text-xl transition-transform hover:scale-110 hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title={disabled ? 'Reactions disabled' : `React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
