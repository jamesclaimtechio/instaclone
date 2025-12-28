import Link from 'next/link';
import { Camera, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Empty state for when the feed has no posts
 * Encourages users to create the first post
 */
export default function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="p-6 rounded-full bg-gray-100 mb-6">
        <Camera className="h-12 w-12 text-gray-400" />
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No posts yet
      </h2>
      <p className="text-gray-600 mb-6 max-w-sm">
        Be the first to share something! Create a post and it will show up here.
      </p>

      {/* CTA */}
      <Button asChild size="lg">
        <Link href="/create" className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Create your first post
        </Link>
      </Button>
    </div>
  );
}

/**
 * End of feed message when user has scrolled through all posts
 */
export function EndOfFeed() {
  return (
    <div className="py-8 text-center">
      <p className="text-gray-500 text-sm">
        You&apos;re all caught up!
      </p>
    </div>
  );
}

