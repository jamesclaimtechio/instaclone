'use client';

import { useState, useOptimistic, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import CommentInput from './comment-input';
import { getComments, deleteComment } from '@/app/actions/comments';
import { 
  type PostComment, 
  formatCommentTimestamp, 
  getCommentAvatarUrl 
} from '@/lib/comments.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface CommentsSectionProps {
  postId: string;
  /** The post author's user ID (for moderation rights) */
  postOwnerId: string;
  /** The current viewing user's ID (for auth checks) */
  currentUserId?: string;
  /** Initial comments to display (optional, for SSR) */
  initialComments?: PostComment[];
}

type OptimisticAction = 
  | { type: 'add'; comment: PostComment }
  | { type: 'remove'; commentId: string };

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Comments section with input form, comment list, and deletion
 * Uses optimistic updates for instant feedback
 */
export default function CommentsSection({ 
  postId,
  postOwnerId,
  currentUserId,
  initialComments = [] 
}: CommentsSectionProps) {
  // State for comments (fetched from server)
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(initialComments.length === 0);

  // Optimistic state for instant add/remove
  const [optimisticComments, dispatchOptimistic] = useOptimistic<
    PostComment[],
    OptimisticAction
  >(comments, (state, action) => {
    if (action.type === 'add') {
      return [action.comment, ...state];
    } else if (action.type === 'remove') {
      return state.filter((c) => c.id !== action.commentId);
    }
    return state;
  });

  // Fetch comments on mount if not provided
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    }
  }, [postId, initialComments.length]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const fetchedComments = await getComments(postId);
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
    dispatchOptimistic({ type: 'add', comment: newComment });
    // Also update the real state (server confirmed)
    setComments((prev) => [newComment, ...prev]);
  };

  // Handle comment deleted
  const handleCommentDeleted = (commentId: string) => {
    // Remove from real state (optimistic already removed)
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="space-y-4">
      {/* Comment Input - only show if user is logged in */}
      {currentUserId && (
        <CommentInput postId={postId} onCommentAdded={handleCommentAdded} />
      )}

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
            <CommentItem 
              key={comment.id} 
              comment={comment}
              postOwnerId={postOwnerId}
              currentUserId={currentUserId}
              onDelete={handleCommentDeleted}
              dispatchOptimistic={dispatchOptimistic}
            />
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
 * Single comment display with optional delete button
 */
interface CommentItemProps {
  comment: PostComment;
  postOwnerId: string;
  currentUserId?: string;
  onDelete: (commentId: string) => void;
  dispatchOptimistic: (action: OptimisticAction) => void;
}

function CommentItem({ 
  comment, 
  postOwnerId, 
  currentUserId,
  onDelete,
  dispatchOptimistic,
}: CommentItemProps) {
  const [isPending, startTransition] = useTransition();
  
  const avatarUrl = getCommentAvatarUrl(
    comment.author.profilePictureUrl,
    comment.author.username
  );

  // Authorization: can delete if user owns comment OR owns post
  const canDelete = currentUserId && (
    currentUserId === comment.author.id || 
    currentUserId === postOwnerId
  );

  // Handle delete confirmation
  const handleDelete = () => {
    if (isPending) return;

    startTransition(async () => {
      // Optimistic removal
      dispatchOptimistic({ type: 'remove', commentId: comment.id });

      try {
        const result = await deleteComment(comment.id);

        if (result.success) {
          // Update real state
          onDelete(comment.id);
        } else {
          // Error - show toast (optimistic will rollback automatically)
          toast.error(result.error || 'Failed to delete comment');
        }
      } catch (error) {
        console.error('[CommentItem] Delete error:', error);
        toast.error('Failed to delete comment. Please try again.');
      }
    });
  };

  return (
    <div className="flex gap-3 group">
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
        <div className="flex items-center gap-3 mt-1">
          <time 
            dateTime={comment.createdAt.toISOString()} 
            className="text-xs text-gray-500"
          >
            {formatCommentTimestamp(comment.createdAt)}
          </time>

          {/* Delete Button - with confirmation dialog */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="h-auto p-0 text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this comment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
