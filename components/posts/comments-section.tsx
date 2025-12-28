'use client';

import { useState, useOptimistic, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import CommentInput from './comment-input';
import { getPostComments } from '@/lib/comments';
import { 
  type PostComment, 
  formatCommentTimestamp, 
  getCommentAvatarUrl 
} from '@/lib/comments.types';

// ============================================================================
// TYPES
// ============================================================================

interface CommentsSectionProps {
  postId: string;
  /** Initial comments to display (optional, for SSR) */
  initialComments?: PostComment[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Comments section with input form and comment list
 * Uses optimistic updates for instant feedback
 */
export default function CommentsSection({ 
  postId, 
  initialComments = [] 
}: CommentsSectionProps) {
  // State for comments (fetched from server)
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(initialComments.length === 0);

  // Optimistic state for instant comment display
  const [optimisticComments, addOptimisticComment] = useOptimistic<
    PostComment[],
    PostComment
  >(comments, (state, newComment) => [newComment, ...state]);

  // Fetch comments on mount if not provided
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    }
  }, [postId, initialComments.length]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('[CommentsSection] Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new comment added
  const handleCommentAdded = (newComment: PostComment) => {
    // Add to optimistic state for instant display
    addOptimisticComment(newComment);
    // Also update the real state (server confirmed)
    setComments((prev) => [newComment, ...prev]);
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <CommentInput postId={postId} onCommentAdded={handleCommentAdded} />

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500">Loading comments...</p>
          </div>
        ) : optimisticComments.length === 0 ? (
          <EmptyComments />
        ) : (
          optimisticComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Empty state when no comments exist
 */
function EmptyComments() {
  return (
    <div className="py-8 text-center">
      <div className="inline-flex p-3 rounded-full bg-gray-100 mb-3">
        <MessageCircle className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">No comments yet.</p>
      <p className="text-xs text-gray-400 mt-1">Be the first to comment!</p>
    </div>
  );
}

/**
 * Single comment display
 */
function CommentItem({ comment }: { comment: PostComment }) {
  const avatarUrl = getCommentAvatarUrl(
    comment.author.profilePictureUrl,
    comment.author.username
  );

  return (
    <div className="flex gap-3">
      {/* Author Avatar */}
      <Link 
        href={`/profile/${comment.author.username}`}
        className="shrink-0"
      >
        <Image
          src={avatarUrl}
          alt={comment.author.username}
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
      </Link>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link
            href={`/profile/${comment.author.username}`}
            className="font-semibold hover:underline mr-1"
          >
            {comment.author.username}
          </Link>
          <span className="whitespace-pre-wrap break-words">{comment.text}</span>
        </p>
        <time 
          dateTime={comment.createdAt.toISOString()} 
          className="text-xs text-gray-500 mt-1 block"
        >
          {formatCommentTimestamp(comment.createdAt)}
        </time>
      </div>
    </div>
  );
}
