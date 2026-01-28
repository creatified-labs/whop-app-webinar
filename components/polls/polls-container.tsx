'use client';

import { useRealtimePolls } from '@/hooks/use-realtime-polls';
import { PollDisplay } from './poll-display';
import type { PollWithResults } from '@/types';

interface PollsContainerProps {
  webinarId: string;
  registrationId: string;
  initialPolls?: PollWithResults[];
  initialResponses?: Record<string, string[]>;
  disabled?: boolean;
}

/**
 * PollsContainer Component
 * Container for all polls with realtime updates
 */
export function PollsContainer({
  webinarId,
  registrationId,
  initialPolls = [],
  initialResponses = {},
  disabled = false,
}: PollsContainerProps) {
  const { polls, activePoll, isConnected, vote, hasVoted, getVote } = useRealtimePolls({
    webinarId,
    registrationId,
    initialPolls,
    initialResponses,
  });

  // Separate active and past polls
  const pastPolls = polls.filter((p) => p.status === 'closed');

  return (
    <div className="flex h-full flex-col">
      {/* Connection status */}
      {!isConnected && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          Connecting to polls...
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {polls.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-gray-500">
              No polls yet. The host may launch one during the webinar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active poll */}
            {activePoll && (
              <div>
                <PollDisplay
                  poll={activePoll}
                  hasVoted={hasVoted(activePoll.id)}
                  userVote={getVote(activePoll.id)}
                  onVote={(options) => vote(activePoll.id, options)}
                />
              </div>
            )}

            {/* Past polls */}
            {pastPolls.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Past Polls
                </h4>
                <div className="space-y-3">
                  {pastPolls.map((poll) => (
                    <PollDisplay
                      key={poll.id}
                      poll={poll}
                      hasVoted={hasVoted(poll.id)}
                      userVote={getVote(poll.id)}
                      onVote={(options) => vote(poll.id, options)}
                      showResults
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
