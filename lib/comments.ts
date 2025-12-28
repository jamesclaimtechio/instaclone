import { db, comments, posts, users } from '@/db';
import { eq, and, desc, count } from 'drizzle-orm';

// Re-export client-safe types
export type { PostComment, CommentAuthor, CommentActionResult } from './comments.types';
export { formatCommentTimestamp, getCommentAvatarUrl } from './comments.types';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates comment text
 * - Must not be empty after trimming
 * - Returns trimmed text or null if invalid
 */
export function validateCommentText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetches all comments for a post with author information
 * Ordered newest first
 * 
 * @param postId - The post ID to fetch comments for
 * @returns Array of comments with author info, or empty array on error
 */
export async function getPostComments(postId: string) {
  if (!isValidUUID(postId)) {
    return [];
  }

  try {
    const result = await db
      .select({
        id: comments.id,
        text: comments.text,
        createdAt: comments.createdAt,
        authorId: users.id,
        authorUsername: users.username,
        authorProfilePictureUrl: users.profilePictureUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    // Transform to PostComment format
    return result.map((row) => ({
      id: row.id,
      text: row.text,
      createdAt: row.createdAt,
      author: {
        id: row.authorId || 'deleted',
        username: row.authorUsername || 'Deleted User',
        profilePictureUrl: row.authorProfilePictureUrl,
      },
    }));
  } catch (error) {
    console.error('[Comments] Error fetching post comments:', error);
    return [];
  }
}

/**
 * Gets the total comment count for a post
 * 
 * @param postId - The post ID to count comments for
 * @returns The number of comments (0 if error or not found)
 */
export async function getCommentCount(postId: string): Promise<number> {
  if (!isValidUUID(postId)) {
    return 0;
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, postId));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('[Comments] Error getting comment count:', error);
    return 0;
  }
}

/**
 * Checks if a post exists in the database
 * 
 * @param postId - The post ID to check
 * @returns true if the post exists
 */
export async function postExists(postId: string): Promise<boolean> {
  if (!isValidUUID(postId)) {
    return false;
  }

  try {
    const result = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('[Comments] Error checking post existence:', error);
    return false;
  }
}

/**
 * Gets a comment by ID with its associated post info
 * Used for authorization checks (verifying post ownership)
 * 
 * @param commentId - The comment ID to fetch
 * @returns Comment with post info, or null if not found
 */
export async function getCommentWithPost(commentId: string) {
  if (!isValidUUID(commentId)) {
    return null;
  }

  try {
    const result = await db
      .select({
        id: comments.id,
        text: comments.text,
        userId: comments.userId,
        postId: comments.postId,
        createdAt: comments.createdAt,
        postUserId: posts.userId,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    console.error('[Comments] Error fetching comment with post:', error);
    return null;
  }
}

/**
 * Validates if a user can delete a comment
 * User can delete if:
 * - They are the comment author
 * - They are the post author (moderation)
 * 
 * @param userId - The user attempting to delete
 * @param commentUserId - The comment author's ID
 * @param postUserId - The post author's ID
 * @returns true if the user can delete the comment
 */
export function canDeleteComment(
  userId: string,
  commentUserId: string,
  postUserId: string
): boolean {
  // User is the comment author
  if (userId === commentUserId) {
    return true;
  }
  
  // User is the post author (can moderate comments on their posts)
  if (userId === postUserId) {
    return true;
  }

  return false;
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Creates a new comment on a post
 * 
 * @param postId - The post ID to comment on
 * @param userId - The user ID creating the comment
 * @param text - The comment text (already validated)
 * @returns The created comment with author info, or null on error
 */
export async function createCommentRecord(
  postId: string,
  userId: string,
  text: string
) {
  if (!isValidUUID(postId) || !isValidUUID(userId)) {
    return null;
  }

  try {
    // Insert the comment
    const insertResult = await db
      .insert(comments)
      .values({
        postId,
        userId,
        text,
      })
      .returning({
        id: comments.id,
        text: comments.text,
        createdAt: comments.createdAt,
      });

    const newComment = insertResult[0];
    if (!newComment) {
      return null;
    }

    // Fetch author info
    const authorResult = await db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const author = authorResult[0];
    if (!author) {
      return null;
    }

    return {
      id: newComment.id,
      text: newComment.text,
      createdAt: newComment.createdAt,
      author: {
        id: author.id,
        username: author.username,
        profilePictureUrl: author.profilePictureUrl,
      },
    };
  } catch (error) {
    console.error('[Comments] Error creating comment:', error);
    return null;
  }
}

/**
 * Deletes a comment by ID
 * 
 * @param commentId - The comment ID to delete
 * @returns true if successfully deleted, false otherwise
 */
export async function deleteCommentRecord(commentId: string): Promise<boolean> {
  if (!isValidUUID(commentId)) {
    return false;
  }

  try {
    const result = await db
      .delete(comments)
      .where(eq(comments.id, commentId))
      .returning({ id: comments.id });

    return result.length > 0;
  } catch (error) {
    console.error('[Comments] Error deleting comment:', error);
    return false;
  }
}

