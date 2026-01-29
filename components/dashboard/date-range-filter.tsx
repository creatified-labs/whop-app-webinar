'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { DateRange } from '@/lib/data/analytics';

interface DateRangeFilterProps {
  currentRange: DateRange;
  basePath: string;
}

const dateRanges: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function DateRangeFilter({ currentRange, basePath }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range === '30d') {
      params.delete('range');
    } else {
      params.set('range', range);
    }

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-a4 bg-gray-a2 p-1">
      {dateRanges.map((range) => {
        const isActive = currentRange === range.value;

        return (
          <button
            key={range.value}
            onClick={() => handleChange(range.value)}
            disabled={isPending}
            className={`
              whitespace-nowrap rounded-full px-4 py-1.5 text-2 font-medium transition-all
              ${isActive
                ? 'bg-gray-1 text-gray-12 shadow-sm'
                : 'text-gray-11 hover:text-gray-12'}
              ${isPending ? 'opacity-50' : ''}
            `}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
