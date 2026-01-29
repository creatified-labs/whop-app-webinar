'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { Button, TextField } from '@whop/react/components';
import type { WebinarStatus } from '@/types/database';

interface WebinarFiltersProps {
  companyId: string;
  currentStatus?: string;
  currentSearch?: string;
  counts: {
    all: number;
    draft: number;
    scheduled: number;
    live: number;
    ended: number;
  };
}

const statusTabs: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
];

export function WebinarFilters({
  companyId,
  currentStatus = 'all',
  currentSearch = '',
  counts,
}: WebinarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const updateParams = (updates: { status?: string; search?: string; page?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (updates.status !== undefined || updates.search !== undefined) {
      params.delete('page');
    }

    startTransition(() => {
      router.push(`/dashboard/${companyId}/webinars?${params.toString()}`);
    });
  };

  const handleStatusChange = (status: string) => {
    updateParams({ status });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search });
  };

  const clearSearch = () => {
    setSearch('');
    updateParams({ search: '' });
  };

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-a4 bg-gray-a2 p-1">
        {statusTabs.map((tab) => {
          const count = counts[tab.value as keyof typeof counts];
          const isActive = currentStatus === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              disabled={isPending}
              className={`
                flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-2 font-medium transition-all
                ${isActive
                  ? 'bg-gray-1 text-gray-12 shadow-sm'
                  : 'text-gray-11 hover:text-gray-12'}
                ${isPending ? 'opacity-50' : ''}
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`
                  text-1 tabular-nums
                  ${isActive ? 'text-gray-11' : 'text-gray-9'}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-9" />
          <input
            type="text"
            placeholder="Search webinars by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2 border border-gray-a6 bg-gray-1 py-2 pl-10 pr-10 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-9 hover:text-gray-11"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="2" variant="soft" disabled={isPending}>
          Search
        </Button>
      </form>
    </div>
  );
}
