import { Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface SocialProofProps {
  registrationCount: number;
}

/**
 * Social Proof
 * Floating pill with avatar stack and live indicator
 */
export function SocialProof({ registrationCount }: SocialProofProps) {
  if (registrationCount === 0) return null;

  return (
    <div className="flex justify-center">
      <div className="funnel-glass inline-flex items-center gap-3 rounded-full px-5 py-3 ring-1 ring-funnel-border/50">
        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          {[...Array(Math.min(3, registrationCount))].map((_, i) => (
            <div
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white ring-2 ring-zinc-900"
              style={{ zIndex: 3 - i }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          {registrationCount > 3 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-funnel-text-secondary ring-2 ring-zinc-900">
              +{Math.min(registrationCount - 3, 99)}
            </div>
          )}
        </div>

        {/* Live indicator dot */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>

        {/* Text */}
        <span className="text-sm text-funnel-text-secondary">
          <strong className="font-semibold text-funnel-text-primary">
            {formatNumber(registrationCount)}
          </strong>{" "}
          {registrationCount === 1 ? "person has" : "people have"} registered
        </span>
      </div>
    </div>
  );
}
