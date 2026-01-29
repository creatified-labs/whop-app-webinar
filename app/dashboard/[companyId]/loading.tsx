/**
 * Dashboard Loading State
 * Skeleton loading for dashboard pages
 */
export default function DashboardLoading() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-a3" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded-lg bg-gray-a2" />
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

      {/* Quick Actions Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-a4 bg-gray-a2 p-4"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-a3" />
              <div>
                <div className="h-5 w-28 animate-pulse rounded bg-gray-a3" />
                <div className="mt-1 h-4 w-40 animate-pulse rounded bg-gray-a2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Webinar Grid Skeleton */}
      <div>
        <div className="mb-4">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-a3" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-a2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-gray-a4 bg-gray-a2"
            >
              <div className="aspect-video animate-pulse bg-gray-a3" />
              <div className="p-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-a3" />
                <div className="mt-3 flex gap-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-a2" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-a2" />
                </div>
                <div className="mt-4 border-t border-gray-a4 pt-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-a2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
