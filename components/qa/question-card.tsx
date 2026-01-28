'use client';

import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, CheckCircle, MessageSquare } from 'lucide-react';
import type { QAQuestion } from '@/types/database';

interface QuestionCardProps {
  question: QAQuestion & { has_upvoted?: boolean };
  onUpvote?: () => void;
  isOwn?: boolean;
}

/**
 * QuestionCard Component
 * Display a Q&A question with upvote button
 */
export function QuestionCard({
  question,
  onUpvote,
  isOwn = false,
}: QuestionCardProps) {
  const timeAgo = formatDistanceToNow(new Date(question.created_at), { addSuffix: true });
  const isAnswered = question.status === 'answered';

  return (
    <div
      className={`rounded-lg border p-4 ${
        question.is_highlighted
          ? 'border-yellow-300 bg-yellow-50'
          : isAnswered
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isAnswered && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="text-xs text-gray-500">{timeAgo}</span>
          {isOwn && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
              You
            </span>
          )}
          {question.is_highlighted && (
            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
              Highlighted
            </span>
          )}
        </div>

        {/* Upvote button */}
        <button
          onClick={onUpvote}
          disabled={isOwn}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors ${
            question.has_upvoted
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isOwn ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${question.has_upvoted ? 'fill-current' : ''}`} />
          <span>{question.upvote_count}</span>
        </button>
      </div>

      {/* Question */}
      <p className="text-sm text-gray-900">{question.question}</p>

      {/* Answer */}
      {isAnswered && question.answer && (
        <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-green-600">
            <MessageSquare className="h-3 w-3" />
            <span>Answer from host</span>
          </div>
          <p className="text-sm text-gray-700">{question.answer}</p>
        </div>
      )}
    </div>
  );
}
