import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Skeleton loader matching the PostCard layout
 * Shows shimmer animation while posts are loading
 */
export default function PostSkeleton() {
  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-3 w-12" />
      </div>

      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" />

      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>

        {/* Like count */}
        <Skeleton className="h-4 w-20" />

        {/* Caption lines */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </article>
  );
}

/**
 * Multiple skeleton loaders for initial feed load
 */
export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

