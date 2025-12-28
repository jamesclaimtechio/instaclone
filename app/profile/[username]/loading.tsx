import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for profile page
 * Shows placeholder content while profile data loads
 */
export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header Skeleton */}
        <div className="flex gap-8 lg:gap-16 items-start">
          {/* Avatar Skeleton */}
          <Skeleton className="w-32 h-32 lg:w-40 lg:h-40 rounded-full flex-shrink-0" />
          
          <div className="flex-1 space-y-4">
            {/* Username and Button */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-9 w-28" />
            </div>
            
            {/* Stats */}
            <div className="flex gap-8">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            
            {/* Bio */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-8" />

        {/* Posts Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </main>
  );
}

