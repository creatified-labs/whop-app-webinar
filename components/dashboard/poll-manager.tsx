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
    draft: 'bg-gray-a3 text-gray-11',
    active: 'bg-green-a3 text-green-11',
    closed: 'bg-blue-a3 text-blue-11',
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
        <div className="glass-depth shadow-glass rounded-3 p-6">
          <h3 className="mb-4 font-semibold text-gray-12">New Poll</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-2 font-medium text-gray-12">
                Question *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="mt-1 w-full rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2.5 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
              />
            </div>

            <div>
              <label className="block text-2 font-medium text-gray-12">
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
                      className="flex-1 rounded-2 border border-gray-a6 bg-gray-1 px-4 py-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-2 p-2 text-gray-11 hover:bg-red-a3 hover:text-red-11"
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
                  className="mt-2 text-2 text-accent-11 hover:underline"
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
                  className="rounded border-gray-a6 bg-gray-1"
                />
                <span className="text-2 text-gray-11">Allow multiple selections</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showResultsLive}
                  onChange={(e) => setShowResultsLive(e.target.checked)}
                  className="rounded border-gray-a6 bg-gray-1"
                />
                <span className="text-2 text-gray-11">Show results live</span>
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
          <div className="glass-light rounded-3 border border-dashed border-gray-a6/50 p-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-8" />
            <h3 className="mt-4 text-3 font-medium text-gray-12">No polls yet</h3>
            <p className="mt-1 text-2 text-gray-11">
              Create your first poll to engage your audience.
            </p>
          </div>
        )}

        {polls.map((poll) => (
          <div
            key={poll.id}
            className="glass shadow-glass-sm rounded-3 p-6 glass-interactive"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-12">{poll.question}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-1 font-medium ${
                      statusColors[poll.status]
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                <p className="mt-1 text-2 text-gray-11">
                  {poll.total_responses} responses
                </p>
              </div>
              <div className="flex gap-2">
                {poll.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange(poll.id, 'active')}
                    disabled={isPending}
                    className="rounded-2 p-2 text-gray-11 hover:bg-green-a3 hover:text-green-11"
                    title="Start Poll"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
                {poll.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(poll.id, 'closed')}
                    disabled={isPending}
                    className="rounded-2 p-2 text-gray-11 hover:bg-blue-a3 hover:text-blue-11"
                    title="Close Poll"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(poll.id)}
                  disabled={isPending}
                  className="rounded-2 p-2 text-gray-11 hover:bg-red-a3 hover:text-red-11"
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
                    <div className="flex justify-between text-2">
                      <span className="text-gray-12">{option.text}</span>
                      <span className="text-gray-11">
                        {result?.count || 0} ({percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-a4">
                      <div
                        className="h-full rounded-full bg-accent-9 transition-all"
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
