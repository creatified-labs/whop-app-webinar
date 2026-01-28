'use client';

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@whop/react/components';

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * QuestionInput Component
 * Input field for submitting Q&A questions
 */
export function QuestionInput({
  onSubmit,
  disabled = false,
  placeholder = 'Ask a question...',
}: QuestionInputProps) {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(question.trim());
      setQuestion('');
    } catch (err) {
      console.error('Failed to submit question:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [question, onSubmit, isSubmitting, disabled]);

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      <div className="flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          rows={2}
          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
          maxLength={500}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {question.length}/500 characters
        </span>
        <Button
          variant="solid"
          onClick={handleSubmit}
          disabled={!question.trim() || isSubmitting || disabled}
        >
          <Send className="mr-1.5 h-4 w-4" />
          Ask
        </Button>
      </div>
    </div>
  );
}
