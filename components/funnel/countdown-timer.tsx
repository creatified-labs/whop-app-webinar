'use client';

import { useState, useEffect } from 'react';
import { getCountdownParts } from '@/lib/utils/date';

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
}

/**
 * Countdown Timer
 * Live countdown to webinar start time
 */
export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() => getCountdownParts(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const parts = getCountdownParts(targetDate);
      setCountdown(parts);

      if (parts.total <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (countdown.total <= 0) {
    return (
      <div className="text-center">
        <span className="text-lg font-semibold text-green-600">Live Now!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <CountdownUnit value={countdown.days} label="Days" />
      <CountdownSeparator />
      <CountdownUnit value={countdown.hours} label="Hours" />
      <CountdownSeparator />
      <CountdownUnit value={countdown.minutes} label="Min" />
      <CountdownSeparator />
      <CountdownUnit value={countdown.seconds} label="Sec" />
    </div>
  );
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-gray-900 tabular-nums sm:text-3xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
    </div>
  );
}

function CountdownSeparator() {
  return <span className="text-2xl font-bold text-gray-300 sm:text-3xl">:</span>;
}

interface CountdownBannerProps {
  targetDate: string;
  onComplete?: () => void;
}

/**
 * Countdown Banner
 * Full-width banner with countdown and label
 */
export function CountdownBanner({ targetDate, onComplete }: CountdownBannerProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
      <p className="mb-3 text-center text-sm font-medium text-gray-600">
        Starts in
      </p>
      <CountdownTimer targetDate={targetDate} onComplete={onComplete} />
    </div>
  );
}
