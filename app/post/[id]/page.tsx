import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { getPostById, formatPostTimestamp, validatePostOwnership } from '@/lib/posts';
import { getAvatarUrl } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import CommentsSection from '@/components/posts/comments-section';
import DeletePostButton from '@/components/posts/delete-post-button';
import LikeButton from '@/components/posts/like-button';

// ============================================================================
// TYPES
// ============================================================================

interface PostPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const description = post.caption
    ? post.caption.slice(0, 160)
    : `Post by @${post.author.username}`;

  return {
    title: `@${post.author.username} on InstaClone`,
    description,
    openGraph: {
      title: `@${post.author.username} on InstaClone`,
      description,
      images: [post.thumbnailUrl],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${post.author.username} on InstaClone`,
      description,
      images: [post.thumbnailUrl],
    },
  };
}

// ============================================================================
// PAGE
// ============================================================================

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  
  // Get current user first for like status
  const currentUser = await getCurrentUser();
  
  // Fetch post with like status
  const post = await getPostById(id, currentUser?.userId);

  if (!post) {
    notFound();
  }

  // Check if current user is the post owner
  const isOwner = currentUser 
    ? validatePostOwnership(currentUser.userId, post)
    : false;

  const { author, caption, imageUrl, blurHash, likeCount, commentCount, createdAt, isLiked } = post;
  const timestamp = formatPostTimestamp(createdAt);
  const avatarUrl = getAvatarUrl(author.profilePictureUrl, author.username);

  // Full date for permalink
  const fullDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 md:top-16">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Back to feed">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-semibold text-lg">Post</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto pb-8">
        <article className="bg-white border-b md:border md:rounded-lg md:my-4 md:overflow-hidden">
          {/* Desktop: Side-by-side layout */}
          <div className="md:flex">
            {/* Image */}
            <div className="relative aspect-square md:w-3/5 bg-black">
              <Image
                src={imageUrl}
                alt={caption || 'Post image'}
                fill
                className="object-contain"
                placeholder="blur"
                blurDataURL={blurHash}
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>

            {/* Details sidebar */}
            <div className="md:w-2/5 md:flex md:flex-col md:border-l">
              {/* Author header */}
              <header className="flex items-center gap-3 p-4 border-b">
                <Link href={`/profile/${author.username}`} className="shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={author.username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/profile/${author.username}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {author.username}
                  </Link>
                </div>
                {/* Delete button - only for post owner */}
                {isOwner && <DeletePostButton postId={post.id} />}
              </header>

              {/* Caption and comments scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Caption */}
                {caption && (
                  <div className="flex gap-3">
                    <Link href={`/profile/${author.username}`} className="shrink-0">
                      <Image
                        src={avatarUrl}
                        alt={author.username}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    </Link>
                    <div>
                      <p className="text-sm">
                        <Link
                          href={`/profile/${author.username}`}
                          className="font-semibold hover:underline mr-1"
                        >
                          {author.username}
                        </Link>
                        <span className="whitespace-pre-wrap">{caption}</span>
                      </p>
                      <time className="text-xs text-gray-500 mt-1 block">
                        {timestamp}
                      </time>
                    </div>
                  </div>
                )}

                {/* Comments section */}
                <CommentsSection 
                  postId={post.id}
                  postOwnerId={author.id}
                  currentUserId={currentUser?.userId}
                />
              </div>

              {/* Actions footer */}
              <footer className="border-t p-4">
                {/* Action buttons */}
                <div className="flex items-start gap-4 mb-3">
                  <LikeButton
                    postId={post.id}
                    initialLikeCount={likeCount}
                    initialIsLiked={isLiked}
                  />
                  <button
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
                    aria-label="Comment"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </button>
                </div>

                {/* Full date */}
                <time dateTime={createdAt.toISOString()} className="text-xs text-gray-500">
                  {fullDate}
                </time>
              </footer>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

