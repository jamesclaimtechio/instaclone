'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { likePost, unlikePost } from '@/app/actions/likes';

// ============================================================================
// TYPES
// ============================================================================

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  /** Show the like count text (default: true) */
  showCount?: boolean;
  /** Show the heart icon (default: true) */
  showIcon?: boolean;
  /** Size variant for the heart icon */
  size?: 'sm' | 'md' | 'lg';
}

interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

type LikeAction = 'like' | 'unlike';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Interactive like button with optimistic UI updates
 * Uses React 19's useOptimistic for instant feedback
 */
export default function LikeButton({
  postId,
  initialLikeCount,
  initialIsLiked,
  showCount = true,
  showIcon = true,
  size = 'md',
}: LikeButtonProps) {
  // useTransition for pending state to disable button during request
  const [isPending, startTransition] = useTransition();

  // useOptimistic for instant UI updates before server confirms
  const [optimisticState, addOptimistic] = useOptimistic<LikeState, LikeAction>(
    { isLiked: initialIsLiked, likeCount: initialLikeCount },
    (state, action) => {
      if (action === 'like') {
        return {
          isLiked: true,
          likeCount: state.likeCount + 1,
        };
      } else {
        return {
          isLiked: false,
          // Prevent negative counts
          likeCount: Math.max(0, state.likeCount - 1),
        };
      }
    }
  );

  const { isLiked, likeCount } = optimisticState;

  // Handle like/unlike action
  const handleClick = () => {
    // Prevent multiple clicks while request is in flight
    if (isPending) return;

    startTransition(async () => {
      // Determine action based on current state
      const action: LikeAction = isLiked ? 'unlike' : 'like';
      
      // Update optimistically first
      addOptimistic(action);

      try {
        // Call the appropriate Server Action
        const result = isLiked 
          ? await unlikePost(postId)
          : await likePost(postId);

        if (!result.success) {
          // Show error toast - optimistic state will rollback automatically
          toast.error(result.error || 'Action failed. Try again.');
        }
      } catch (error) {
        // Network error or unexpected failure
        console.error('[LikeButton] Error:', error);
        toast.error('Action failed. Please try again.');
        // useOptimistic automatically rolls back on error
      }
    });
  };

  // Icon sizes based on variant
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  // Format like count text
  const likeText = likeCount === 0
    ? 'Be the first to like'
    : likeCount === 1
      ? '1 like'
      : `${likeCount.toLocaleString()} likes`;

  // ARIA label for accessibility
  const ariaLabel = isLiked 
    ? `Unlike this post. ${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`
    : `Like this post. ${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;

  // If showing only count (no icon), just render as text
  if (!showIcon && showCount) {
    return (
      <p className="font-semibold text-sm">
        {likeText}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Like button with heart icon */}
      {showIcon && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          aria-label={ariaLabel}
          aria-pressed={isLiked}
          className={`
            group flex items-center gap-1 
            transition-all duration-200 ease-out
            disabled:cursor-not-allowed disabled:opacity-70
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
            rounded-sm
            ${isPending ? 'pointer-events-none' : ''}
          `}
        >
          <Heart
            className={`
              ${iconSizes[size]}
              transition-all duration-200 ease-out
              ${isLiked 
                ? 'fill-red-500 text-red-500 scale-100' 
                : 'fill-transparent text-gray-600 group-hover:text-red-500 group-hover:scale-110'
              }
              ${isPending ? 'animate-pulse' : ''}
              active:scale-90
            `}
          />
        </button>
      )}

      {/* Like count text */}
      {showCount && (
        <p className="font-semibold text-sm mt-2">
          {likeText}
        </p>
      )}
    </div>
  );
}

