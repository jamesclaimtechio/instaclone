'use server';

/**
 * Admin Moderation Server Actions
 * 
 * Delete functionality for users, posts, and comments.
 * All actions require admin authentication.
 */

import { getCurrentUser } from '@/lib/auth';
import { db, users, posts, comments } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { isValidUUID } from '@/lib/utils';
import { getUserCascadeStats, getPostCascadeStats, type UserCascadeStats, type PostCascadeStats } from '@/lib/admin';

// ============================================================================
// TYPES
// ============================================================================

interface AdminActionResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// ADMIN DELETE ACTIONS
// ============================================================================

/**
 * Delete a user and all their content (posts, comments, likes, follows)
 * Cascade deletion handled by database foreign key constraints
 */
export async function adminDeleteUser(userId: string): Promise<AdminActionResult> {
  try {
    // 1. Verify admin authorization
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    if (!currentUser.isAdmin) {
      return { success: false, error: 'Not authorized. Admin access required.' };
    }

    // 2. Validate userId format
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID format' };
    }

    // 3. Check if trying to delete self
    if (userId === currentUser.userId) {
      // Allow but the admin will be logged out
      console.log('[adminDeleteUser] Admin is deleting their own account');
    }

    // 4. Delete user (cascade will handle posts, comments, likes, follows)
    const result = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });

    if (result.length === 0) {
      return { success: false, error: 'User not found' };
    }

    // 5. Revalidate admin pages
    revalidatePath('/admin/users');
    revalidatePath('/admin/posts');
    revalidatePath('/admin/comments');
    revalidatePath('/admin');

    console.log(`[adminDeleteUser] User ${userId} deleted by admin ${currentUser.userId}`);
    return { success: true };
  } catch (error) {
    console.error('[adminDeleteUser] Error:', error);
    return { success: false, error: 'Failed to delete user. Please try again.' };
  }
}

/**
 * Delete a post and all its likes and comments
 * Cascade deletion handled by database foreign key constraints
 */
export async function adminDeletePost(postId: string): Promise<AdminActionResult> {
  try {
    // 1. Verify admin authorization
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    if (!currentUser.isAdmin) {
      return { success: false, error: 'Not authorized. Admin access required.' };
    }

    // 2. Validate postId format
    if (!isValidUUID(postId)) {
      return { success: false, error: 'Invalid post ID format' };
    }

    // 3. Delete post (cascade will handle likes and comments)
    const result = await db.delete(posts).where(eq(posts.id, postId)).returning({ id: posts.id });

    if (result.length === 0) {
      return { success: false, error: 'Post not found' };
    }

    // 4. Revalidate admin pages
    revalidatePath('/admin/posts');
    revalidatePath('/admin/comments');
    revalidatePath('/admin');
    revalidatePath('/'); // Feed

    console.log(`[adminDeletePost] Post ${postId} deleted by admin ${currentUser.userId}`);
    return { success: true };
  } catch (error) {
    console.error('[adminDeletePost] Error:', error);
    return { success: false, error: 'Failed to delete post. Please try again.' };
  }
}

/**
 * Delete a single comment
 * No cascade needed - comments have no children
 */
export async function adminDeleteComment(commentId: string): Promise<AdminActionResult> {
  try {
    // 1. Verify admin authorization
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    if (!currentUser.isAdmin) {
      return { success: false, error: 'Not authorized. Admin access required.' };
    }

    // 2. Validate commentId format
    if (!isValidUUID(commentId)) {
      return { success: false, error: 'Invalid comment ID format' };
    }

    // 3. Delete comment
    const result = await db.delete(comments).where(eq(comments.id, commentId)).returning({ id: comments.id });

    if (result.length === 0) {
      return { success: false, error: 'Comment not found' };
    }

    // 4. Revalidate admin pages
    revalidatePath('/admin/comments');
    revalidatePath('/admin');

    console.log(`[adminDeleteComment] Comment ${commentId} deleted by admin ${currentUser.userId}`);
    return { success: true };
  } catch (error) {
    console.error('[adminDeleteComment] Error:', error);
    return { success: false, error: 'Failed to delete comment. Please try again.' };
  }
}

// ============================================================================
// CASCADE STATS ACTIONS (for delete confirmation modals)
// ============================================================================

/**
 * Fetch cascade stats for a user (for delete confirmation)
 * Wraps the query function as a Server Action for client component usage
 */
export async function fetchUserCascadeStats(userId: string): Promise<UserCascadeStats> {
  // Note: No admin check here - stats are not sensitive, just informational
  if (!isValidUUID(userId)) {
    return { postCount: 0, commentCount: 0, likeCount: 0 };
  }
  return getUserCascadeStats(userId);
}

/**
 * Fetch cascade stats for a post (for delete confirmation)
 * Wraps the query function as a Server Action for client component usage
 */
export async function fetchPostCascadeStats(postId: string): Promise<PostCascadeStats> {
  // Note: No admin check here - stats are not sensitive, just informational
  if (!isValidUUID(postId)) {
    return { likeCount: 0, commentCount: 0 };
  }
  return getPostCascadeStats(postId);
}

