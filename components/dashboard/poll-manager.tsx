'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Play, Square, BarChart3 } from 'lucide-react';
import { Button } from '@whop/react/components';
import { generateId } from '@/lib/utils/slug';
import type { Poll, PollStatus } from '@/types/database';
import type { PollWithResults } from '@/types';

interface PollManagerProps {
  polls: PollWithResults[];
  webinarId: string;
  onCreatePoll: (data: {
    question: string;
    options: { id: string; text: string }[];
    allow_multiple: boolean;
    show_results_live: boolean;
  }) => Promise<void>;
  onUpdatePollStatus: (pollId: string, status: PollStatus) => Promise<void>;
  onDeletePoll: (pollId: string) => Promise<void>;
}

/**
 * Poll Manager
 * Create, manage, and view poll results
 */
export function PollManager({
  polls,
  webinarId,
  onCreatePoll,
  onUpdatePollStatus,
  onDeletePoll,
}: PollManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // New poll form state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: generateId(), text: '' },
    { id: generateId(), text: '' },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showResultsLive, setShowResultsLive] = useState(true);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: generateId(), text: '' }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, text: string) => {
    setOptions(options.map((opt, i) => (i === index ? { ...opt, text } : opt)));
  };

  const handleCreate = () => {
    if (!question.trim()) return;
    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) return;

    startTransition(async () => {
      await onCreatePoll({
        question: question.trim(),
        options: validOptions,
        allow_multiple: allowMultiple,
        show_results_live: showResultsLive,
      });

      // Reset form
      setQuestion('');
      setOptions([
        { id: generateId(), text: '' },
        { id: generateId(), text: '' },
      ]);
      setAllowMultiple(false);
      setShowResultsLive(true);
      setIsCreating(false);
      router.refresh();
    });
  };

  const handleStatusChange = (pollId: string, status: PollStatus) => {
    startTransition(async () => {
      await onUpdatePollStatus(pollId, status);
      router.refresh();
    });
  };

  const handleDelete = (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    startTransition(async () => {
      await onDeletePoll(pollId);
      router.refresh();
    });
  };

  const statusColors: Record<PollStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {!isCreating && (
        <Button variant="solid" onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Poll
        </Button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">New Poll</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Question *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Options (2-10)
              </label>
              <div className="mt-2 space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex gap-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>

            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Allow multiple selections</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showResultsLive}
                  onChange={(e) => setShowResultsLive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show results live</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="soft"
                onClick={() => setIsCreating(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={handleCreate}
                disabled={isPending || !question.trim() || options.filter((o) => o.text.trim()).length < 2}
              >
                Create Poll
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Poll List */}
      <div className="space-y-4">
        {polls.length === 0 && !isCreating && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No polls yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first poll to engage your audience.
            </p>
          </div>
        )}

        {polls.map((poll) => (
          <div
            key={poll.id}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{poll.question}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[poll.status]
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {poll.total_responses} responses
                </p>
              </div>
              <div className="flex gap-2">
                {poll.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange(poll.id, 'active')}
                    disabled={isPending}
                    className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
                    title="Start Poll"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
                {poll.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(poll.id, 'closed')}
                    disabled={isPending}
                    className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                    title="Close Poll"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(poll.id)}
                  disabled={isPending}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="mt-4 space-y-2">
              {(poll.options as { id: string; text: string }[]).map((option) => {
                const result = poll.results.find((r) => r.option_id === option.id);
                const percentage = result?.percentage || 0;
                return (
                  <div key={option.id}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{option.text}</span>
                      <span className="text-gray-500">
                        {result?.count || 0} ({percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
