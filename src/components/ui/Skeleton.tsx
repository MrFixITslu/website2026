export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-app-btn-sec/70 ${className}`} />;
}

/** Generic Suspense fallback for lazy-loaded route-like sections (course detail, tool feedback). */
export function SectionLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

/** Mirrors the resource article-card anatomy (cover image, tag, title, blurb). */
export function ArticleCardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-app-border overflow-hidden" aria-hidden="true">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="w-20 h-3 rounded" />
        <Skeleton className="w-full h-4 rounded" />
        <Skeleton className="w-2/3 h-3 rounded" />
      </div>
    </div>
  );
}

/**
 * Mirrors the real marketplace app-card anatomy (logo box, badge, title,
 * subtitle, rating line) so the loading state doesn't visibly "pop" into a
 * differently-shaped card once real data arrives.
 */
export function AppCardSkeleton() {
  return (
    <div className="glass p-5 rounded-2xl flex flex-col gap-4" aria-hidden="true">
      <div className="flex justify-between items-start">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-4 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-4 rounded" />
        <Skeleton className="w-1/2 h-3 rounded" />
        <Skeleton className="w-20 h-3 rounded mt-3" />
      </div>
      <Skeleton className="w-full h-8 rounded-lg" />
    </div>
  );
}
