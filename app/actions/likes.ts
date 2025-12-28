'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import {
  isValidUUID,
  postExists,
  getLikeStatus,
  getLikeCount,
  createLike,
  deleteLike,
  type LikeActionResult,
} from '@/lib/likes';

// ============================================================================
// LIKE POST SERVER ACTION
// ============================================================================

/**
 * Likes a post for the current user
 * 
 * @param postId - The ID of the post to like
 * @returns LikeActionResult with success status, like count, and isLiked
 */
export async function likePost(postId: string): Promise<LikeActionResult> {
  try {
    // 1. Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Not authenticated',
      };
    }

    // 2. Validate postId format
    if (!isValidUUID(postId)) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Invalid post ID',
      };
    }

    // 3. Check if post exists
    const exists = await postExists(postId);
    if (!exists) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Post not found',
      };
    }

    // 4. Create the like (handles duplicate gracefully)
    const newCount = await createLike(postId, currentUser.userId);
    if (newCount === -1) {
      return {
        success: false,
        likeCount: await getLikeCount(postId),
        isLiked: await getLikeStatus(postId, currentUser.userId),
        error: 'Failed to like post',
      };
    }

    // 5. Revalidate the feed cache
    revalidatePath('/');

    return {
      success: true,
      likeCount: newCount,
      isLiked: true,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[LikePost] Error:', error);
    return {
      success: false,
      likeCount: 0,
      isLiked: false,
      error: 'Failed to like post',
    };
  }
}

// ============================================================================
// UNLIKE POST SERVER ACTION
// ============================================================================

/**
 * Unlikes a post for the current user
 * 
 * @param postId - The ID of the post to unlike
 * @returns LikeActionResult with success status, like count, and isLiked
 */
export async function unlikePost(postId: string): Promise<LikeActionResult> {
  try {
    // 1. Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Not authenticated',
      };
    }

    // 2. Validate postId format
    if (!isValidUUID(postId)) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Invalid post ID',
      };
    }

    // 3. Delete the like (idempotent - no error if doesn't exist)
    const newCount = await deleteLike(postId, currentUser.userId);
    if (newCount === -1) {
      return {
        success: false,
        likeCount: await getLikeCount(postId),
        isLiked: await getLikeStatus(postId, currentUser.userId),
        error: 'Failed to unlike post',
      };
    }

    // 4. Revalidate the feed cache
    revalidatePath('/');

    return {
      success: true,
      likeCount: newCount,
      isLiked: false,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[UnlikePost] Error:', error);
    return {
      success: false,
      likeCount: 0,
      isLiked: false,
      error: 'Failed to unlike post',
    };
  }
}

// ============================================================================
// TOGGLE LIKE SERVER ACTION
// ============================================================================

/**
 * Toggles the like status of a post for the current user
 * Convenience function that determines whether to like or unlike
 * 
 * @param postId - The ID of the post to toggle
 * @returns LikeActionResult with success status, like count, and isLiked
 */
export async function toggleLike(postId: string): Promise<LikeActionResult> {
  try {
    // 1. Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Not authenticated',
      };
    }

    // 2. Validate postId format
    if (!isValidUUID(postId)) {
      return {
        success: false,
        likeCount: 0,
        isLiked: false,
        error: 'Invalid post ID',
      };
    }

    // 3. Check current like status
    const isCurrentlyLiked = await getLikeStatus(postId, currentUser.userId);

    // 4. Toggle based on current status
    if (isCurrentlyLiked) {
      return await unlikePost(postId);
    } else {
      return await likePost(postId);
    }
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[ToggleLike] Error:', error);
    return {
      success: false,
      likeCount: 0,
      isLiked: false,
      error: 'Failed to toggle like',
    };
  }
}

