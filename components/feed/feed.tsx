'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import PostCard from '@/components/feed/post-card';
import EmptyFeed, { EndOfFeed } from '@/components/feed/empty-feed';
import { loadMorePosts, SerializedCursor } from '@/app/actions/posts';
import { FeedPost } from '@/lib/posts.types';

// ============================================================================
// TYPES
// ============================================================================

interface FeedProps {
  initialPosts: FeedPost[];
  initialHasMore: boolean;
  initialNextCursor?: {
    createdAt: Date;
    id: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Feed component with infinite scroll
 * Server renders initial posts, client handles pagination
 */
export default function Feed({ 
  initialPosts, 
  initialHasMore, 
  initialNextCursor 
}: FeedProps) {
  // State
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<SerializedCursor | undefined>(
    initialNextCursor 
      ? { createdAt: initialNextCursor.createdAt.toISOString(), id: initialNextCursor.id }
      : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await loadMorePosts(nextCursor);
      
      // Append new posts
      setPosts(prev => [...prev, ...response.posts]);
      setHasMore(response.hasMore);
      
      // Update cursor
      if (response.nextCursor) {
        setNextCursor({
          createdAt: response.nextCursor.createdAt.toISOString(),
          id: response.nextCursor.id,
        });
      } else {
        setNextCursor(undefined);
      }
    } catch (err) {
      console.error('[Feed] Error loading more posts:', err);
      setError('Couldn\'t load more posts. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, nextCursor]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target?.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: '100px', // Trigger when 100px from bottom
        threshold: 0.1,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  // Empty state
  if (posts.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <div className="space-y-4">
      {/* Post cards */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Load more trigger / loading indicator */}
      <div ref={loadMoreRef} className="py-4">
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={loadMore}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!hasMore && !isLoading && posts.length > 0 && <EndOfFeed />}
      </div>
    </div>
  );
}

