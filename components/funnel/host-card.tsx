import Image from "next/image";
import type { WebinarHost } from "@/types/database";
import { getInitials } from "@/lib/utils";

interface HostCardProps {
  host: Pick<WebinarHost, "name" | "title" | "bio" | "image_url">;
}

/**
 * Host Card
 * Premium card with hover glow effects and scale animation
 */
export function HostCard({ host }: HostCardProps) {
  return (
    <div className="group flex flex-col items-center text-center">
      {/* Avatar with Glow Ring */}
      <div className="relative">
        {/* Glow ring on hover */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-50" />

        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800 ring-2 ring-funnel-border transition-transform duration-300 group-hover:scale-105">
          {host.image_url ? (
            <Image
              src={host.image_url}
              alt={host.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-semibold text-white">
              {getInitials(host.name)}
            </div>
          )}
        </div>
      </div>

      {/* Name & Title */}
      <div className="mt-4">
        <p className="font-semibold text-funnel-text-primary">{host.name}</p>
        {host.title && (
          <p className="text-sm text-funnel-text-secondary">{host.title}</p>
        )}
      </div>

      {/* Bio */}
      {host.bio && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-funnel-text-muted line-clamp-3">
          {host.bio}
        </p>
      )}
    </div>
  );
}

interface HostListProps {
  hosts: Pick<WebinarHost, "id" | "name" | "title" | "bio" | "image_url">[];
}

/**
 * Host List
 * Premium horizontal list with glassmorphism cards
 */
export function HostList({ hosts }: HostListProps) {
  if (hosts.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-center text-sm font-medium uppercase tracking-wider text-funnel-text-muted">
        {hosts.length === 1 ? "Your Host" : "Your Hosts"}
      </h2>
      <div className="flex justify-center gap-8 overflow-x-auto pb-4">
        {hosts.map((host) => (
          <div
            key={host.id}
            className="funnel-glass flex-shrink-0 rounded-funnel-xl p-6 transition-all duration-300 hover:bg-funnel-bg-elevated/80"
          >
            <HostCard host={host} />
          </div>
        ))}
      </div>
    </div>
  );
}
