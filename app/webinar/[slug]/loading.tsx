/**
 * Webinar Loading State
 * Premium skeleton UI while webinar data loads
 */
export default function WebinarLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Cover Image Skeleton */}
        <div className="funnel-gradient-border overflow-hidden rounded-funnel-2xl">
          <div className="aspect-video w-full animate-pulse bg-zinc-800/50" />
        </div>

        {/* Title Skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-3/4 animate-pulse rounded-funnel-lg bg-zinc-800/50" />
          <div className="h-5 w-1/2 animate-pulse rounded-funnel-md bg-zinc-800/30" />
        </div>

        {/* Countdown Skeleton */}
        <div className="funnel-glass rounded-funnel-xl p-6">
          <div className="flex items-center justify-center gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 animate-pulse rounded-funnel-lg bg-zinc-800/50" />
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-800/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form Skeleton */}
        <div className="funnel-glass rounded-funnel-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-14 flex-1 animate-pulse rounded-funnel-xl bg-zinc-800/50" />
            <div className="h-14 w-full animate-pulse rounded-funnel-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 sm:w-48" />
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-3 p-6">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-800/30" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800/40" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800/40" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800/40" />
        </div>

        {/* Hosts Section Skeleton */}
        <div className="border-t border-zinc-800/50 pt-8">
          <div className="mb-6 h-5 w-24 animate-pulse rounded bg-zinc-800/30" />
          <div className="flex gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="funnel-glass flex flex-col items-center rounded-funnel-xl p-6"
              >
                <div className="h-20 w-20 animate-pulse rounded-full bg-zinc-800/50" />
                <div className="mt-4 h-4 w-24 animate-pulse rounded bg-zinc-800/40" />
                <div className="mt-2 h-3 w-20 animate-pulse rounded bg-zinc-800/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
