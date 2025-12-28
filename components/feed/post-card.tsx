'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { formatPostTimestamp, FeedPost } from '@/lib/posts';
import { getAvatarUrl } from '@/lib/profile';

// ============================================================================
// TYPES
// ============================================================================

interface PostCardProps {
  post: FeedPost;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Individual post card for the feed
 * Displays author info, image with blur placeholder, caption, and engagement counts
 */
export default function PostCard({ post }: PostCardProps) {
  const { author, caption, thumbnailUrl, blurHash, likeCount, commentCount, createdAt, id } = post;
  
  // Format timestamp
  const timestamp = formatPostTimestamp(createdAt);
  
  // Get avatar URL with fallback
  const avatarUrl = getAvatarUrl(author.profilePictureUrl, author.username);

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header: Author info */}
      <header className="flex items-center gap-3 p-3">
        <Link 
          href={`/profile/${author.username}`}
          className="shrink-0"
        >
          <Image
            src={avatarUrl}
            alt={author.username}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            href={`/profile/${author.username}`}
            className="font-semibold text-sm text-gray-900 hover:underline"
          >
            {author.username}
          </Link>
        </div>
        <time 
          dateTime={createdAt.toISOString()} 
          className="text-xs text-gray-500"
        >
          {timestamp}
        </time>
      </header>

      {/* Image - links to post permalink */}
      <Link href={`/post/${id}`} className="block relative aspect-square">
        <Image
          src={thumbnailUrl}
          alt={caption || 'Post image'}
          fill
          className="object-cover"
          placeholder="blur"
          blurDataURL={blurHash}
          sizes="(max-width: 640px) 100vw, 600px"
        />
      </Link>

      {/* Actions and Counts */}
      <div className="p-3 space-y-2">
        {/* Action buttons (like/comment icons - not functional yet) */}
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
            aria-label={`${likeCount} likes`}
          >
            <Heart className="h-6 w-6" />
          </button>
          <Link 
            href={`/post/${id}`}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
            aria-label={`${commentCount} comments`}
          >
            <MessageCircle className="h-6 w-6" />
          </Link>
        </div>

        {/* Like count */}
        <p className="font-semibold text-sm">
          {likeCount === 0 ? 'Be the first to like' : `${likeCount.toLocaleString()} ${likeCount === 1 ? 'like' : 'likes'}`}
        </p>

        {/* Caption */}
        {caption && (
          <p className="text-sm">
            <Link 
              href={`/profile/${author.username}`}
              className="font-semibold hover:underline mr-1"
            >
              {author.username}
            </Link>
            <span className="whitespace-pre-wrap">{caption}</span>
          </p>
        )}

        {/* Comment count link */}
        {commentCount > 0 && (
          <Link 
            href={`/post/${id}`}
            className="text-sm text-gray-500 hover:underline"
          >
            View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </Link>
        )}
      </div>
    </article>
  );
}

