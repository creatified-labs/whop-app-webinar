/**
 * New Webinar Loading State
 * Skeleton loading for the create webinar page
 */
export default function NewWebinarLoading() {
  return (
    <div className="p-6">
      {/* Back Link Skeleton */}
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-gray-a3" />

      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-a3" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded bg-gray-a2" />
      </div>

      {/* Form Skeleton */}
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-3 border border-gray-a4 bg-gray-a2 p-6">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-a3" />
            <div className="mt-4 h-12 w-full animate-pulse rounded-2 bg-gray-a3" />
          </div>
        ))}
        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-a3" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-accent-a3" />
        </div>
      </div>
    </div>
  );
}
