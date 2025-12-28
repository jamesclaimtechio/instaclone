import { db, likes, posts } from '@/db';
import { eq, and, inArray, count } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a like/unlike operation
 */
export interface LikeActionResult {
  success: boolean;
  likeCount: number;
  isLiked: boolean;
  error?: string;
}

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

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Checks if a user has liked a specific post
 * 
 * @param postId - The post ID to check
 * @param userId - The user ID to check
 * @returns true if the user has liked the post
 */
export async function getLikeStatus(postId: string, userId: string): Promise<boolean> {
  if (!isValidUUID(postId) || !isValidUUID(userId)) {
    return false;
  }

  try {
    const result = await db
      .select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('[Likes] Error checking like status:', error);
    return false;
  }
}

/**
 * Gets the total like count for a post
 * 
 * @param postId - The post ID to count likes for
 * @returns The number of likes (0 if error or not found)
 */
export async function getLikeCount(postId: string): Promise<number> {
  if (!isValidUUID(postId)) {
    return 0;
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, postId));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('[Likes] Error getting like count:', error);
    return 0;
  }
}

/**
 * Batch fetch like statuses for multiple posts for a user
 * Used to efficiently check which posts in a feed the user has liked
 * 
 * @param userId - The user ID to check
 * @param postIds - Array of post IDs to check
 * @returns Set of postIds that the user has liked
 */
export async function getUserLikes(userId: string, postIds: string[]): Promise<Set<string>> {
  // Return empty set if no user or no posts to check
  if (!userId || !isValidUUID(userId) || postIds.length === 0) {
    return new Set();
  }

  // Filter out invalid UUIDs
  const validPostIds = postIds.filter(isValidUUID);
  if (validPostIds.length === 0) {
    return new Set();
  }

  try {
    const result = await db
      .select({ postId: likes.postId })
      .from(likes)
      .where(and(eq(likes.userId, userId), inArray(likes.postId, validPostIds)));

    return new Set(result.map((row) => row.postId));
  } catch (error) {
    console.error('[Likes] Error getting user likes:', error);
    return new Set();
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
    console.error('[Likes] Error checking post existence:', error);
    return false;
  }
}

/**
 * Creates a like record for a user on a post
 * Returns the new like count after insertion
 * 
 * @param postId - The post ID to like
 * @param userId - The user ID liking the post
 * @returns The new like count, or -1 on error
 */
export async function createLike(postId: string, userId: string): Promise<number> {
  if (!isValidUUID(postId) || !isValidUUID(userId)) {
    return -1;
  }

  try {
    await db.insert(likes).values({
      postId,
      userId,
    });

    // Get the updated count
    return await getLikeCount(postId);
  } catch (error: any) {
    // Handle unique constraint violation (user already liked this post)
    // This is expected and idempotent - just return current count
    // Note: Drizzle/Neon wraps the PostgreSQL error in error.cause
    const pgErrorCode = error?.code || error?.cause?.code;
    const isUniqueViolation = 
      pgErrorCode === '23505' || 
      error?.message?.includes('unique') ||
      error?.cause?.message?.includes('unique');

    if (isUniqueViolation) {
      console.log('[Likes] Like already exists (idempotent):', postId, userId);
      return await getLikeCount(postId);
    }

    console.error('[Likes] Error creating like:', error);
    return -1;
  }
}

/**
 * Deletes a like record for a user on a post
 * Returns the new like count after deletion
 * 
 * @param postId - The post ID to unlike
 * @param userId - The user ID unliking the post
 * @returns The new like count, or -1 on error
 */
export async function deleteLike(postId: string, userId: string): Promise<number> {
  if (!isValidUUID(postId) || !isValidUUID(userId)) {
    return -1;
  }

  try {
    await db
      .delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    // Get the updated count (even if no rows were deleted - idempotent)
    return await getLikeCount(postId);
  } catch (error) {
    console.error('[Likes] Error deleting like:', error);
    return -1;
  }
}

