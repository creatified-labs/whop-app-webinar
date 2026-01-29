/**
 * Analytics Page Loading State
 * Skeleton loading for analytics dashboard
 */
export default function AnalyticsLoading() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-a3" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded-lg bg-gray-a2" />
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-a4 bg-gray-a2 p-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-a3" />
          ))}
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-a4 bg-gray-a2 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-a3" />
                <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-gray-a4" />
                <div className="mt-2 h-4 w-20 animate-pulse rounded bg-gray-a3" />
              </div>
              <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-a3" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="h-5 w-40 animate-pulse rounded bg-gray-a3" />
              <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-a2" />
            </div>
            <div className="text-right">
              <div className="h-7 w-16 animate-pulse rounded bg-gray-a4" />
              <div className="mt-1 h-3 w-10 animate-pulse rounded bg-gray-a3" />
            </div>
          </div>
          <div className="h-48 animate-pulse rounded-lg bg-gray-a3" />
        </div>

        {/* Traffic Sources */}
        <div className="rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
          <div className="mb-4">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-a3" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-gray-a2" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-a3" />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-a3" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-a2" />
                  </div>
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-gray-a3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Table Skeleton */}
      <div className="rounded-2xl border border-gray-a4 bg-gray-a2 overflow-hidden">
        <div className="p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-a3" />
          <div className="mt-1 h-4 w-56 animate-pulse rounded bg-gray-a2" />
        </div>
        <div className="border-t border-gray-a4">
          <div className="bg-gray-a3 px-4 py-3">
            <div className="flex gap-4">
              {[120, 80, 100, 80, 60].map((width, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-gray-a4"
                  style={{ width: `${width}px` }}
                />
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-gray-a3 px-4 py-4">
              <div className="flex-1">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-a3" />
                <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-a2" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-a3" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-a3" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-a3" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-a3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
