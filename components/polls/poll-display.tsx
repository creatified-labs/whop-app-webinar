'use client';

import { BarChart3, Clock, CheckCircle } from 'lucide-react';
import type { PollWithResults } from '@/types';
import { PollVote } from './poll-vote';
import { PollResults } from './poll-results';

interface PollDisplayProps {
  poll: PollWithResults;
  hasVoted: boolean;
  userVote?: string[] | null;
  onVote: (selectedOptions: string[]) => Promise<void>;
  showResults?: boolean;
}

/**
 * PollDisplay Component
 * Display poll with vote/results based on state
 */
export function PollDisplay({
  poll,
  hasVoted,
  userVote,
  onVote,
  showResults = false,
}: PollDisplayProps) {
  const options = poll.options as { id: string; text: string }[];
  const isActive = poll.status === 'active';
  const isClosed = poll.status === 'closed';
  const shouldShowResults = hasVoted || showResults || poll.show_results_live || isClosed;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-500">
            {isActive ? 'Active Poll' : isClosed ? 'Poll Closed' : 'Poll'}
          </span>
          {hasVoted && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              Voted
            </span>
          )}
        </div>
        <h3 className="mt-1 text-sm font-medium text-gray-900">{poll.question}</h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {shouldShowResults ? (
          <PollResults
            options={options}
            results={poll.results}
            totalResponses={poll.total_responses}
            selectedOptions={userVote || []}
          />
        ) : isActive ? (
          <PollVote
            options={options}
            allowMultiple={poll.allow_multiple}
            onVote={onVote}
          />
        ) : (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Poll not yet started
          </div>
        )}
      </div>
    </div>
  );
}
