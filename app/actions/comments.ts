'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import {
  isValidUUID,
  validateCommentText,
  postExists,
  getCommentWithPost,
  getCommentCount,
  createCommentRecord,
  deleteCommentRecord,
  canDeleteComment,
  type CommentActionResult,
} from '@/lib/comments';

// ============================================================================
// CREATE COMMENT SERVER ACTION
// ============================================================================

/**
 * Creates a new comment on a post
 * 
 * @param postId - The post ID to comment on
 * @param text - The comment text
 * @returns CommentActionResult with success status, created comment, and count
 */
export async function createComment(
  postId: string,
  text: string
): Promise<CommentActionResult> {
  try {
    // 1. Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        commentCount: 0,
        error: 'Not authenticated',
      };
    }

    // 2. Validate postId format
    if (!isValidUUID(postId)) {
      return {
        success: false,
        commentCount: 0,
        error: 'Invalid post ID',
      };
    }

    // 3. Validate comment text (trim and check not empty)
    const validatedText = validateCommentText(text);
    if (!validatedText) {
      return {
        success: false,
        commentCount: await getCommentCount(postId),
        error: 'Comment cannot be empty',
      };
    }

    // 4. Check if post exists
    const exists = await postExists(postId);
    if (!exists) {
      return {
        success: false,
        commentCount: 0,
        error: 'Post not found',
      };
    }

    // 5. Create the comment
    const newComment = await createCommentRecord(postId, currentUser.userId, validatedText);
    if (!newComment) {
      return {
        success: false,
        commentCount: await getCommentCount(postId),
        error: 'Failed to post comment',
      };
    }

    // 6. Get updated comment count
    const commentCount = await getCommentCount(postId);

    // 7. Revalidate cache
    revalidatePath('/');
    revalidatePath(`/post/${postId}`);

    return {
      success: true,
      comment: newComment,
      commentCount,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[CreateComment] Error:', error);
    return {
      success: false,
      commentCount: 0,
      error: 'Failed to post comment',
    };
  }
}

// ============================================================================
// DELETE COMMENT SERVER ACTION
// ============================================================================

/**
 * Deletes a comment
 * User can delete if they are the comment author or the post author
 * 
 * @param commentId - The comment ID to delete
 * @returns CommentActionResult with success status and updated count
 */
export async function deleteComment(commentId: string): Promise<CommentActionResult> {
  try {
    // 1. Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        commentCount: 0,
        error: 'Not authenticated',
      };
    }

    // 2. Validate commentId format
    if (!isValidUUID(commentId)) {
      return {
        success: false,
        commentCount: 0,
        error: 'Invalid comment ID',
      };
    }

    // 3. Fetch comment with post info for authorization check
    const commentWithPost = await getCommentWithPost(commentId);
    if (!commentWithPost) {
      return {
        success: false,
        commentCount: 0,
        error: 'Comment not found',
      };
    }

    // 4. Check authorization
    const canDelete = canDeleteComment(
      currentUser.userId,
      commentWithPost.userId,
      commentWithPost.postUserId
    );
    if (!canDelete) {
      return {
        success: false,
        commentCount: await getCommentCount(commentWithPost.postId),
        error: 'Not authorized to delete this comment',
      };
    }

    // 5. Delete the comment
    const deleted = await deleteCommentRecord(commentId);
    if (!deleted) {
      return {
        success: false,
        commentCount: await getCommentCount(commentWithPost.postId),
        error: 'Failed to delete comment',
      };
    }

    // 6. Get updated comment count
    const commentCount = await getCommentCount(commentWithPost.postId);

    // 7. Revalidate cache
    revalidatePath('/');
    revalidatePath(`/post/${commentWithPost.postId}`);

    return {
      success: true,
      commentCount,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[DeleteComment] Error:', error);
    return {
      success: false,
      commentCount: 0,
      error: 'Failed to delete comment',
    };
  }
}

