import { Globe, Mail, Share2, Link as LinkIcon } from 'lucide-react';
import { Card, Heading, Text } from '@whop/react/components';
import type { TrafficSource } from '@/lib/data/analytics';

interface TrafficSourcesProps {
  sources: TrafficSource[];
}

const sourceIcons: Record<string, typeof Globe> = {
  Direct: Globe,
  Email: Mail,
  Social: Share2,
  Referral: LinkIcon,
};

const sourceColors: Record<string, string> = {
  Direct: 'bg-blue-a3 text-blue-11',
  Email: 'bg-purple-a3 text-purple-11',
  Social: 'bg-pink-a3 text-pink-11',
  Referral: 'bg-orange-a3 text-orange-11',
};

export function TrafficSources({ sources }: TrafficSourcesProps) {
  if (sources.length === 0) {
    return (
      <Card size="2">
        <Heading size="4" weight="semi-bold" className="mb-1">
          Traffic Sources
        </Heading>
        <Text size="2" color="gray" className="mb-4">
          Where your registrants come from
        </Text>
        <div className="flex h-32 items-center justify-center">
          <Text size="2" color="gray">
            No traffic data available
          </Text>
        </div>
      </Card>
    );
  }

  const totalCount = sources.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card size="2">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          Traffic Sources
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Where your registrants come from
        </Text>
      </div>

      <div className="space-y-3">
        {sources.map((source) => {
          const Icon = sourceIcons[source.source] || Globe;
          const colorClass = sourceColors[source.source] || 'bg-gray-a3 text-gray-11';

          return (
            <div key={source.source} className="flex items-center gap-3">
              <div className={`rounded-2 p-2 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Text size="2" weight="medium" className="truncate">
                    {source.source}
                  </Text>
                  <Text size="2" color="gray">
                    {source.count} ({source.percentage}%)
                  </Text>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-gray-a3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-9 transition-all"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-a4">
        <div className="flex items-center justify-between">
          <Text size="2" color="gray">
            Total registrations
          </Text>
          <Text size="2" weight="bold">
            {totalCount}
          </Text>
        </div>
      </div>
    </Card>
  );
}
