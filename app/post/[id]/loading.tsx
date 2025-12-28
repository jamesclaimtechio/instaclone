import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// LOADING STATE
// ============================================================================

export default function PostLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 md:top-16">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-5 w-20" />
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="max-w-4xl mx-auto pb-8">
        <article className="bg-white border-b md:border md:rounded-lg md:my-4 md:overflow-hidden">
          <div className="md:flex">
            {/* Image skeleton */}
            <div className="aspect-square md:w-3/5">
              <Skeleton className="w-full h-full" />
            </div>

            {/* Details skeleton */}
            <div className="md:w-2/5 md:flex md:flex-col md:border-l">
              {/* Author header */}
              <header className="flex items-center gap-3 p-4 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </header>

              {/* Content area */}
              <div className="flex-1 p-4 space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>

              {/* Footer skeleton */}
              <footer className="border-t p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </footer>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

