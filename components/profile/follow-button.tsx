'use client';

/**
 * Follow Button Component
 * 
 * Interactive button for following/unfollowing users with optimistic UI.
 * Uses React 19's useOptimistic for instant feedback before server confirmation.
 */

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { followUser, unfollowUser } from '@/app/actions/follows';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface FollowButtonProps {
  /** The user ID to follow/unfollow */
  targetUserId: string;
  /** Whether the current user is already following this user */
  initialIsFollowing: boolean;
  /** Initial follower count for optimistic updates */
  initialFollowerCount: number;
  /** Optional callback when follow state changes (for parent state updates) */
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
}

interface FollowState {
  isFollowing: boolean;
  followerCount: number;
}

type FollowAction = 'follow' | 'unfollow';

// ============================================================================
// COMPONENT
// ============================================================================

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  onFollowChange,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant feedback
  const [optimisticState, addOptimistic] = useOptimistic<FollowState, FollowAction>(
    { isFollowing: initialIsFollowing, followerCount: initialFollowerCount },
    (state, action) => {
      if (action === 'follow') {
        return {
          isFollowing: true,
          followerCount: state.followerCount + 1,
        };
      } else {
        return {
          isFollowing: false,
          // Prevent negative counts
          followerCount: Math.max(0, state.followerCount - 1),
        };
      }
    }
  );

  const { isFollowing, followerCount } = optimisticState;

  // Handle follow/unfollow click
  const handleClick = () => {
    if (isPending) return;

    startTransition(async () => {
      const action: FollowAction = isFollowing ? 'unfollow' : 'follow';
      
      // Apply optimistic update immediately
      addOptimistic(action);

      try {
        const result = isFollowing
          ? await unfollowUser(targetUserId)
          : await followUser(targetUserId);

        if (!result.success) {
          // Error - toast will show, optimistic state auto-rollbacks
          if (result.error === 'Not authenticated') {
            toast.error('Please log in to follow users');
          } else if (result.error === 'Cannot follow yourself') {
            toast.error("You can't follow yourself");
          } else {
            toast.error(result.error || 'Action failed. Try again.');
          }
          return;
        }

        // Success - notify parent if callback provided
        if (onFollowChange && result.followerCount !== undefined) {
          onFollowChange(result.isFollowing ?? !isFollowing, result.followerCount);
        }
      } catch (error) {
        console.error('[FollowButton] Error:', error);
        toast.error('Action failed. Try again.');
      }
    });
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={`
        min-w-[100px] transition-all duration-200
        ${isFollowing 
          ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
          : ''
        }
      `}
      aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
      aria-pressed={isFollowing}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-1.5" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}

