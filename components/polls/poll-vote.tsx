'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@whop/react/components';

interface PollVoteProps {
  options: { id: string; text: string }[];
  allowMultiple: boolean;
  onVote: (selectedOptions: string[]) => Promise<void>;
  disabled?: boolean;
}

/**
 * PollVote Component
 * Vote interface for polls
 */
export function PollVote({
  options,
  allowMultiple,
  onVote,
  disabled = false,
}: PollVoteProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  const toggleOption = (optionId: string) => {
    if (disabled || isVoting) return;

    if (allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || isVoting || disabled) return;

    setIsVoting(true);
    try {
      await onVote(selectedOptions);
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={disabled || isVoting}
              className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${disabled || isVoting ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                  allowMultiple ? 'rounded' : 'rounded-full'
                } border-2 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        variant="solid"
        onClick={handleVote}
        disabled={selectedOptions.length === 0 || isVoting || disabled}
        className="w-full"
      >
        {isVoting ? 'Submitting...' : 'Submit Vote'}
      </Button>

      {allowMultiple && (
        <p className="text-center text-xs text-gray-500">
          Select all that apply
        </p>
      )}
    </div>
  );
}
