'use client';

import { Card, Heading, Text } from '@whop/react/components';
import type { RegistrationTrendPoint } from '@/lib/data/analytics';

interface AnalyticsChartProps {
  data: RegistrationTrendPoint[];
  title: string;
  description?: string;
}

export function AnalyticsChart({ data, title, description }: AnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <Card size="2">
        <Heading size="4" weight="semi-bold" className="mb-1">
          {title}
        </Heading>
        {description && (
          <Text size="2" color="gray" className="mb-4">
            {description}
          </Text>
        )}
        <div className="flex h-48 items-center justify-center">
          <Text size="2" color="gray">
            No data available for this period
          </Text>
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalRegistrations = data.reduce((sum, d) => sum + d.count, 0);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Sample labels (show ~7 labels max)
  const labelStep = Math.ceil(data.length / 7);
  const showLabel = (index: number) => index % labelStep === 0 || index === data.length - 1;

  return (
    <Card size="2">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Heading size="4" weight="semi-bold">
            {title}
          </Heading>
          {description && (
            <Text size="2" color="gray" className="mt-0.5">
              {description}
            </Text>
          )}
        </div>
        <div className="text-right">
          <Text size="5" weight="bold">
            {totalRegistrations}
          </Text>
          <Text size="1" color="gray">
            total
          </Text>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <div className="flex h-full items-end gap-0.5">
          {data.map((point, index) => {
            const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;

            return (
              <div
                key={point.date}
                className="group relative flex flex-1 flex-col items-center"
              >
                {/* Bar */}
                <div className="relative w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-1 bg-accent-9 transition-all hover:bg-accent-10"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10">
                    <div className="rounded-2 bg-gray-12 px-2 py-1 text-center shadow-3">
                      <Text size="1" className="text-gray-1 whitespace-nowrap">
                        {formatDate(point.date)}
                      </Text>
                      <Text size="2" weight="bold" className="text-gray-1">
                        {point.count}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Label */}
                {showLabel(index) && (
                  <Text size="1" color="gray" className="mt-2 whitespace-nowrap">
                    {formatDate(point.date)}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
