/**
 * Webinar Detail Loading State
 * Skeleton loading for webinar detail and sub-pages
 */
export default function WebinarDetailLoading() {
  return (
    <div className="p-6">
      {/* Back Link Skeleton */}
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-gray-a3" />

      {/* Header Card Skeleton */}
      <div className="mb-6 rounded-3 border border-gray-a4 bg-gray-a2 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-a3" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-a3" />
            </div>
            <div className="mt-3 flex gap-4">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-a2" />
              <div className="h-5 w-24 animate-pulse rounded bg-gray-a2" />
              <div className="h-5 w-28 animate-pulse rounded bg-gray-a2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-a3" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-a3" />
          </div>
        </div>
      </div>

      {/* Quick Links Skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-3 border-2 border-gray-a4 bg-gray-a2 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 animate-pulse rounded-2 bg-gray-a3" />
              <div>
                <div className="h-5 w-20 animate-pulse rounded bg-gray-a3" />
                <div className="mt-1 h-4 w-12 animate-pulse rounded bg-gray-a2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Section Skeleton */}
      <div>
        <div className="mb-6">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-a3" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-a2" />
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-3 border border-gray-a4 bg-gray-a2 p-6">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-a3" />
              <div className="mt-4 h-12 w-full animate-pulse rounded-2 bg-gray-a3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
