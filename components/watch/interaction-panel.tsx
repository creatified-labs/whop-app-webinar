'use client';

import { useState } from 'react';
import { MessageCircle, HelpCircle, BarChart3 } from 'lucide-react';
import { ChatContainer } from '@/components/chat';
import { QAContainer } from '@/components/qa';
import { PollsContainer } from '@/components/polls';
import type { ChatMessage, QAQuestion } from '@/types/database';
import type { PollWithResults } from '@/types';

type TabId = 'chat' | 'qa' | 'polls';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof MessageCircle;
}

const TABS: Tab[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'qa', label: 'Q&A', icon: HelpCircle },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
];

interface InteractionPanelProps {
  webinarId: string;
  registrationId: string;
  registrationName?: string;
  chatEnabled?: boolean;
  qaEnabled?: boolean;
  pollsEnabled?: boolean;
  initialChatMessages?: ChatMessage[];
  initialQuestions?: QAQuestion[];
  initialUpvotedQuestionIds?: string[];
  initialPolls?: PollWithResults[];
  initialPollResponses?: Record<string, string[]>;
}

/**
 * Interaction Panel
 * Right-side panel with Chat, Q&A, and Polls tabs
 */
export function InteractionPanel({
  webinarId,
  registrationId,
  registrationName = 'Anonymous',
  chatEnabled = true,
  qaEnabled = true,
  pollsEnabled = true,
  initialChatMessages = [],
  initialQuestions = [],
  initialUpvotedQuestionIds = [],
  initialPolls = [],
  initialPollResponses = {},
}: InteractionPanelProps) {
  // Filter tabs based on enabled features
  const enabledTabs = TABS.filter((tab) => {
    if (tab.id === 'chat') return chatEnabled;
    if (tab.id === 'qa') return qaEnabled;
    if (tab.id === 'polls') return pollsEnabled;
    return true;
  });

  const [activeTab, setActiveTab] = useState<TabId>(enabledTabs[0]?.id || 'chat');

  if (enabledTabs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Interaction features are disabled for this webinar</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {enabledTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && chatEnabled && (
          <ChatContainer
            webinarId={webinarId}
            registrationId={registrationId}
            registrationName={registrationName}
            initialMessages={initialChatMessages}
          />
        )}
        {activeTab === 'qa' && qaEnabled && (
          <QAContainer
            webinarId={webinarId}
            registrationId={registrationId}
            initialQuestions={initialQuestions}
            initialUpvotedIds={initialUpvotedQuestionIds}
          />
        )}
        {activeTab === 'polls' && pollsEnabled && (
          <PollsContainer
            webinarId={webinarId}
            registrationId={registrationId}
            initialPolls={initialPolls}
            initialResponses={initialPollResponses}
          />
        )}
      </div>
    </div>
  );
}
