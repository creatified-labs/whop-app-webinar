"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, HelpCircle, BarChart3 } from "lucide-react";
import { ChatContainer } from "@/components/chat";
import { QAContainer } from "@/components/qa";
import { PollsContainer } from "@/components/polls";
import type { ChatMessage, QAQuestion } from "@/types/database";
import type { PollWithResults } from "@/types";

type TabId = "chat" | "qa" | "polls";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof MessageCircle;
}

const TABS: Tab[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "qa", label: "Q&A", icon: HelpCircle },
  { id: "polls", label: "Polls", icon: BarChart3 },
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
 * Premium tabbed panel with animated underline indicator
 */
export function InteractionPanel({
  webinarId,
  registrationId,
  registrationName = "Anonymous",
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
    if (tab.id === "chat") return chatEnabled;
    if (tab.id === "qa") return qaEnabled;
    if (tab.id === "polls") return pollsEnabled;
    return true;
  });

  const [activeTab, setActiveTab] = useState<TabId>(
    enabledTabs[0]?.id || "chat"
  );
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map());

  // Update indicator position when tab changes
  useEffect(() => {
    const activeElement = tabRefs.current.get(activeTab);
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeTab, enabledTabs.length]);

  if (enabledTabs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-funnel-text-muted">
        <p>Interaction features are disabled for this webinar</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col glass">
      {/* Tabs with Animated Indicator */}
      <div className="relative glass-heavy border-b border-funnel-border/30">
        <div className="flex">
          {enabledTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-indigo-400"
                    : "text-funnel-text-muted hover:text-funnel-text-secondary"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Animated Underline Indicator */}
        <div
          className="funnel-tab-indicator"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>

      {/* Tab Content */}
      <div className="funnel-scrollbar flex-1 overflow-hidden">
        {activeTab === "chat" && chatEnabled && (
          <ChatContainer
            webinarId={webinarId}
            registrationId={registrationId}
            registrationName={registrationName}
            initialMessages={initialChatMessages}
          />
        )}
        {activeTab === "qa" && qaEnabled && (
          <QAContainer
            webinarId={webinarId}
            registrationId={registrationId}
            initialQuestions={initialQuestions}
            initialUpvotedIds={initialUpvotedQuestionIds}
          />
        )}
        {activeTab === "polls" && pollsEnabled && (
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
