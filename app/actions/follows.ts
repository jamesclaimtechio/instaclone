'use server';

/**
 * Follow System Server Actions
 * 
 * Handles follow and unfollow operations with proper authentication,
 * validation, and idempotent behavior.
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import {
  createFollow,
  deleteFollow,
  getFollowCounts,
  userExistsById,
  isValidUUID,
} from '@/lib/follows';
import type { FollowActionResult } from '@/lib/follows.types';

// ============================================================================
// FOLLOW USER
// ============================================================================

/**
 * Follow a user
 * 
 * @param targetUserId - The ID of the user to follow
 * @returns FollowActionResult with updated counts
 */
export async function followUser(
  targetUserId: string
): Promise<FollowActionResult> {
  try {
    // 1. Authentication check
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const currentUserId = currentUser.userId;

    // 2. Validate target UUID
    if (!isValidUUID(targetUserId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    // 3. Self-follow prevention
    if (currentUserId === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // 4. Check target user exists
    const targetExists = await userExistsById(targetUserId);
    if (!targetExists) {
      return { success: false, error: 'User not found' };
    }

    // 5. Create follow (idempotent - returns true even if already following)
    const created = await createFollow(currentUserId, targetUserId);
    if (!created) {
      return { success: false, error: 'Failed to follow user' };
    }

    // 6. Get updated counts
    const [targetCounts, currentUserCounts] = await Promise.all([
      getFollowCounts(targetUserId),
      getFollowCounts(currentUserId),
    ]);

    // 7. Revalidate affected paths
    revalidatePath(`/profile/[username]`, 'page');
    revalidatePath('/', 'page');

    return {
      success: true,
      followerCount: targetCounts.followers,
      followingCount: currentUserCounts.following,
      isFollowing: true,
    };
  } catch (error) {
    console.error('[followUser] Error:', error);
    return { success: false, error: 'Failed to follow user' };
  }
}

// ============================================================================
// UNFOLLOW USER
// ============================================================================

/**
 * Unfollow a user
 * 
 * @param targetUserId - The ID of the user to unfollow
 * @returns FollowActionResult with updated counts
 */
export async function unfollowUser(
  targetUserId: string
): Promise<FollowActionResult> {
  try {
    // 1. Authentication check
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const currentUserId = currentUser.userId;

    // 2. Validate target UUID
    if (!isValidUUID(targetUserId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    // 3. Delete follow (idempotent - succeeds even if not following)
    const deleted = await deleteFollow(currentUserId, targetUserId);
    if (!deleted) {
      return { success: false, error: 'Failed to unfollow user' };
    }

    // 4. Get updated counts
    const [targetCounts, currentUserCounts] = await Promise.all([
      getFollowCounts(targetUserId),
      getFollowCounts(currentUserId),
    ]);

    // 5. Revalidate affected paths
    revalidatePath(`/profile/[username]`, 'page');
    revalidatePath('/', 'page');

    return {
      success: true,
      followerCount: targetCounts.followers,
      followingCount: currentUserCounts.following,
      isFollowing: false,
    };
  } catch (error) {
    console.error('[unfollowUser] Error:', error);
    return { success: false, error: 'Failed to unfollow user' };
  }
}

