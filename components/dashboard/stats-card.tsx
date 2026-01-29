import { type LucideIcon } from 'lucide-react';
import { Card, Heading, Text } from '@whop/react/components';
import { formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'gray' | 'accent' | 'green' | 'orange' | 'red';
}

const colorStyles = {
  gray: {
    iconBg: 'bg-gray-a3',
    iconColor: 'text-gray-11',
  },
  accent: {
    iconBg: 'bg-accent-a3',
    iconColor: 'text-accent-11',
  },
  green: {
    iconBg: 'bg-green-a3',
    iconColor: 'text-green-11',
  },
  orange: {
    iconBg: 'bg-orange-a3',
    iconColor: 'text-orange-11',
  },
  red: {
    iconBg: 'bg-red-a3',
    iconColor: 'text-red-11',
  },
};

/**
 * Stats Card
 * Modern stats card using Frosted UI
 */
export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'gray',
}: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <Card size="2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text size="2" color="gray" weight="medium">
            {title}
          </Text>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading size="6" weight="bold">
              {formatNumber(value)}
            </Heading>
            {trend && (
              <Text
                size="1"
                weight="medium"
                color={trend.isPositive ? 'green' : 'red'}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </Text>
            )}
          </div>
          {description && (
            <Text size="1" color="gray" className="mt-1">
              {description}
            </Text>
          )}
        </div>

        <div className={`rounded-3 p-2.5 ${styles.iconBg}`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
      </div>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
}

/**
 * Stats Grid
 * Responsive grid for stats cards
 */
export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
