/**
 * Webinars Page Loading State
 * Skeleton loading for webinars listing
 */
export default function WebinarsLoading() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-a3" />
          <div className="mt-2 h-5 w-56 animate-pulse rounded-lg bg-gray-a2" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-a3" />
      </div>

      {/* Filters Skeleton */}
      <div className="mb-6 space-y-4">
        {/* Status Tabs */}
        <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-a4 bg-gray-a2 p-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-a3" />
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="h-10 w-full max-w-md animate-pulse rounded-2 bg-gray-a3" />
          <div className="h-10 w-20 animate-pulse rounded-2 bg-gray-a3" />
        </div>
      </div>

      {/* Webinar Grid Skeleton */}
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
                <div className="flex items-center justify-between">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-a2" />
                  <div className="flex gap-1">
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-a2" />
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-a2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
