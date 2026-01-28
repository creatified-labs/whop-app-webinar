'use client';

import { useRealtimeQA } from '@/hooks/use-realtime-qa';
import { QuestionCard } from './question-card';
import { QuestionInput } from './question-input';
import type { QAQuestion } from '@/types/database';

interface QAContainerProps {
  webinarId: string;
  registrationId: string;
  initialQuestions?: QAQuestion[];
  initialUpvotedIds?: string[];
  disabled?: boolean;
}

/**
 * QAContainer Component
 * Full Q&A interface with questions and input
 */
export function QAContainer({
  webinarId,
  registrationId,
  initialQuestions = [],
  initialUpvotedIds = [],
  disabled = false,
}: QAContainerProps) {
  const { questions, isConnected, submitQuestion, toggleUpvote } = useRealtimeQA({
    webinarId,
    registrationId,
    initialQuestions,
    initialUpvotedIds,
  });

  return (
    <div className="flex h-full flex-col">
      {/* Connection status */}
      {!isConnected && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          Connecting to Q&A...
        </div>
      )}

      {/* Questions */}
      <div className="flex-1 overflow-y-auto">
        {questions.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-sm text-gray-500">
              No questions yet. Ask the first question!
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                isOwn={question.registration_id === registrationId}
                onUpvote={() => toggleUpvote(question.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <QuestionInput
        onSubmit={submitQuestion}
        disabled={disabled || !isConnected}
        placeholder={disabled ? 'Q&A is disabled' : 'Ask a question...'}
      />
    </div>
  );
}
