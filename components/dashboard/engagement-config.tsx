'use client';

import { useState, useTransition } from 'react';
import { Trophy, MessageCircle, HelpCircle, Vote, Heart, MousePointerClick, Play, Loader2 } from 'lucide-react';
import { Card, Heading, Text, Button } from '@whop/react/components';
import { updateEngagementConfig } from '@/app/actions/settings';
import type { EngagementConfig } from '@/types/database';

interface EngagementConfigFormProps {
  companyId: string;
  initialConfig?: Partial<EngagementConfig>;
}

const DEFAULT_CONFIG = {
  chat_message_points: 1,
  qa_submit_points: 3,
  qa_upvote_points: 1,
  poll_response_points: 2,
  reaction_points: 1,
  cta_click_points: 5,
  watch_25_points: 5,
  watch_50_points: 10,
  watch_75_points: 15,
  watch_100_points: 25,
};

export function EngagementConfigForm({
  companyId,
  initialConfig,
}: EngagementConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState({
    chat_message_points: initialConfig?.chat_message_points ?? DEFAULT_CONFIG.chat_message_points,
    qa_submit_points: initialConfig?.qa_submit_points ?? DEFAULT_CONFIG.qa_submit_points,
    qa_upvote_points: initialConfig?.qa_upvote_points ?? DEFAULT_CONFIG.qa_upvote_points,
    poll_response_points: initialConfig?.poll_response_points ?? DEFAULT_CONFIG.poll_response_points,
    reaction_points: initialConfig?.reaction_points ?? DEFAULT_CONFIG.reaction_points,
    cta_click_points: initialConfig?.cta_click_points ?? DEFAULT_CONFIG.cta_click_points,
    watch_25_points: initialConfig?.watch_25_points ?? DEFAULT_CONFIG.watch_25_points,
    watch_50_points: initialConfig?.watch_50_points ?? DEFAULT_CONFIG.watch_50_points,
    watch_75_points: initialConfig?.watch_75_points ?? DEFAULT_CONFIG.watch_75_points,
    watch_100_points: initialConfig?.watch_100_points ?? DEFAULT_CONFIG.watch_100_points,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof typeof config, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setConfig((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateEngagementConfig(companyId, config);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Failed to save');
      }
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const inputClassName = "w-16 rounded border border-gray-a6 bg-gray-1 px-2 py-1 text-sm text-gray-12 text-center focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8";

  return (
    <Card size="2">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          <Trophy className="mr-2 inline h-5 w-5 text-amber-500" />
          Engagement Scoring
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Configure point values for lead scoring. Higher points = more valuable actions.
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Interaction Points */}
        <div className="space-y-3">
          <Text size="2" weight="medium" color="gray">
            Interaction Points
          </Text>

          <div className="grid grid-cols-2 gap-3">
            {/* Chat Message */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <Text size="2">Chat Message</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.chat_message_points}
                onChange={(e) => handleChange('chat_message_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* Q&A Submit */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <HelpCircle className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <Text size="2">Q&A Question</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.qa_submit_points}
                onChange={(e) => handleChange('qa_submit_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* Q&A Upvote */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <HelpCircle className="h-4 w-4 text-purple-400" />
              <div className="flex-1">
                <Text size="2">Q&A Upvote</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.qa_upvote_points}
                onChange={(e) => handleChange('qa_upvote_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* Poll Response */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <Vote className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <Text size="2">Poll Vote</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.poll_response_points}
                onChange={(e) => handleChange('poll_response_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* Reaction */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <Heart className="h-4 w-4 text-red-500" />
              <div className="flex-1">
                <Text size="2">Reaction</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.reaction_points}
                onChange={(e) => handleChange('reaction_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* CTA Click */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <MousePointerClick className="h-4 w-4 text-orange-500" />
              <div className="flex-1">
                <Text size="2">CTA Click</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.cta_click_points}
                onChange={(e) => handleChange('cta_click_points', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Watch Time Milestones */}
        <div className="space-y-3">
          <Text size="2" weight="medium" color="gray">
            Watch Time Milestones
          </Text>

          <div className="grid grid-cols-2 gap-3">
            {/* 25% */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <Play className="h-4 w-4 text-teal-400" />
              <div className="flex-1">
                <Text size="2">25% Watched</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.watch_25_points}
                onChange={(e) => handleChange('watch_25_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* 50% */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <Play className="h-4 w-4 text-teal-500" />
              <div className="flex-1">
                <Text size="2">50% Watched</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.watch_50_points}
                onChange={(e) => handleChange('watch_50_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* 75% */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <Play className="h-4 w-4 text-teal-600" />
              <div className="flex-1">
                <Text size="2">75% Watched</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.watch_75_points}
                onChange={(e) => handleChange('watch_75_points', e.target.value)}
                className={inputClassName}
              />
            </div>

            {/* 100% */}
            <div className="flex items-center gap-2 rounded-2 border border-gray-a4 p-3">
              <Play className="h-4 w-4 text-teal-700" />
              <div className="flex-1">
                <Text size="2">100% Watched</Text>
              </div>
              <input
                type="number"
                min="0"
                value={config.watch_100_points}
                onChange={(e) => handleChange('watch_100_points', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Text size="2" color="red">
            {error}
          </Text>
        )}
        {success && (
          <Text size="2" color="green">
            Engagement scoring saved
          </Text>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            size="2"
            variant="soft"
            color="gray"
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            type="submit"
            size="2"
            variant="solid"
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
