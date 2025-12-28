import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getFeedPosts } from '@/lib/posts';
import Feed from '@/components/feed/feed';
import { PostSkeletonList } from '@/components/feed/post-skeleton';
import { Suspense } from 'react';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Feed | InstaClone',
  description: 'See the latest posts from everyone',
};

// ============================================================================
// FEED DATA FETCHER
// ============================================================================

async function FeedData() {
  // Fetch initial posts
  const { posts, hasMore, nextCursor } = await getFeedPosts({ limit: 25 });

  return (
    <Feed
      initialPosts={posts}
      initialHasMore={hasMore}
      initialNextCursor={nextCursor}
    />
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default async function HomePage() {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            InstaClone
          </h1>
        </header>

        {/* Feed with suspense boundary */}
        <Suspense fallback={<PostSkeletonList count={3} />}>
          <FeedData />
        </Suspense>
      </div>
    </div>
  );
}
