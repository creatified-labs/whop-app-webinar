"use client";

import { useState, useEffect, useRef } from "react";
import { getCountdownParts } from "@/lib/utils/date";
import { Sparkles } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
}

/**
 * Countdown Timer
 * Premium countdown with glowing numbers and tick animation
 */
export function CountdownTimer({
  targetDate,
  onComplete,
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(targetDate)
  );
  const [tickKey, setTickKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const parts = getCountdownParts(targetDate);
      setCountdown(parts);
      setTickKey((k) => k + 1);

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
        <span className="inline-flex items-center gap-2 text-lg font-semibold text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live Now!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <CountdownUnit value={countdown.days} label="Days" tickKey={tickKey} />
      <CountdownSeparator />
      <CountdownUnit value={countdown.hours} label="Hours" tickKey={tickKey} />
      <CountdownSeparator />
      <CountdownUnit value={countdown.minutes} label="Min" tickKey={tickKey} />
      <CountdownSeparator />
      <CountdownUnit value={countdown.seconds} label="Sec" tickKey={tickKey} />
    </div>
  );
}

interface CountdownUnitProps {
  value: number;
  label: string;
  tickKey: number;
}

function CountdownUnit({ value, label, tickKey }: CountdownUnitProps) {
  const prevValue = useRef(value);
  const changed = prevValue.current !== value;
  prevValue.current = value;

  return (
    <div className="flex flex-col items-center">
      <div
        key={`${label}-${tickKey}`}
        className={`funnel-glass flex h-14 w-14 items-center justify-center rounded-funnel-lg shadow-funnel-md sm:h-16 sm:w-16 ${
          changed ? "animate-funnel-countdown-tick" : ""
        }`}
        style={{
          boxShadow:
            "0 0 20px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        <span className="funnel-gradient-text text-2xl font-bold tabular-nums sm:text-3xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-[10px] font-medium uppercase tracking-wider text-funnel-text-muted sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <span className="mb-6 text-2xl font-bold text-funnel-text-muted/50 sm:text-3xl">
      :
    </span>
  );
}

interface CountdownBannerProps {
  targetDate: string;
  onComplete?: () => void;
}

/**
 * Countdown Banner
 * Premium glassmorphism banner with countdown
 */
export function CountdownBanner({
  targetDate,
  onComplete,
}: CountdownBannerProps) {
  return (
    <div className="funnel-glass rounded-funnel-xl px-6 py-6">
      <div className="mb-4 flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <p className="text-sm font-medium uppercase tracking-wider text-funnel-text-muted">
          Starts in
        </p>
        <Sparkles className="h-4 w-4 text-indigo-400" />
      </div>
      <CountdownTimer targetDate={targetDate} onComplete={onComplete} />
    </div>
  );
}
