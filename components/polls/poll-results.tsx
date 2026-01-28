'use client';

interface PollResultsProps {
  options: { id: string; text: string }[];
  results: { option_id: string; count: number; percentage: number }[];
  totalResponses: number;
  selectedOptions?: string[];
}

/**
 * PollResults Component
 * Display poll results with animated bars
 */
export function PollResults({
  options,
  results,
  totalResponses,
  selectedOptions = [],
}: PollResultsProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const result = results.find((r) => r.option_id === option.id);
        const percentage = result?.percentage || 0;
        const count = result?.count || 0;
        const isSelected = selectedOptions.includes(option.id);

        return (
          <div key={option.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={`${isSelected ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                {option.text}
                {isSelected && ' (Your vote)'}
              </span>
              <span className="text-gray-500">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isSelected ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      <p className="text-center text-xs text-gray-500">
        {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
      </p>
    </div>
  );
}
