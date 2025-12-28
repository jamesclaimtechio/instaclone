/**
 * Follow System Data Layer
 * 
 * Server-only query functions for the follow system.
 * Contains database operations - do NOT import in client components.
 */

import { db, follows, users } from '@/db';
import { eq, and, count, sql } from 'drizzle-orm';

// Re-export types for convenience
export * from './follows.types';

// Import types
import { type FollowCounts, isValidUUID } from './follows.types';

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Check if viewer is following a target user
 * 
 * @param viewerId - The ID of the user who may be following
 * @param targetId - The ID of the user who may be followed
 * @returns true if viewer follows target, false otherwise
 */
export async function getFollowStatus(
  viewerId: string | null | undefined,
  targetId: string
): Promise<boolean> {
  // No viewer = not following
  if (!viewerId) {
    return false;
  }

  // Validate UUIDs
  if (!isValidUUID(viewerId) || !isValidUUID(targetId)) {
    return false;
  }

  // Self-follow is always false
  if (viewerId === targetId) {
    return false;
  }

  try {
    const result = await db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, viewerId),
          eq(follows.followingId, targetId)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('[getFollowStatus] Error:', error);
    return false;
  }
}

/**
 * Get follower and following counts for a user
 * 
 * @param userId - The user ID to get counts for
 * @returns FollowCounts with followers and following counts
 */
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  // Validate UUID
  if (!isValidUUID(userId)) {
    return { followers: 0, following: 0 };
  }

  try {
    // Run both count queries in parallel
    const [followersResult, followingResult] = await Promise.all([
      // Followers: people who follow this user (followingId = userId)
      db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followingId, userId)),

      // Following: people this user follows (followerId = userId)
      db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followerId, userId)),
    ]);

    return {
      followers: followersResult[0]?.count ?? 0,
      following: followingResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error('[getFollowCounts] Error:', error);
    return { followers: 0, following: 0 };
  }
}

/**
 * Get only the follower count for a user
 * 
 * @param userId - The user ID to get follower count for
 * @returns Number of followers
 */
export async function getFollowerCount(userId: string): Promise<number> {
  if (!isValidUUID(userId)) {
    return 0;
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('[getFollowerCount] Error:', error);
    return 0;
  }
}

/**
 * Get only the following count for a user
 * 
 * @param userId - The user ID to get following count for
 * @returns Number of users being followed
 */
export async function getFollowingCount(userId: string): Promise<number> {
  if (!isValidUUID(userId)) {
    return 0;
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('[getFollowingCount] Error:', error);
    return 0;
  }
}

/**
 * Check if a user exists by ID
 * 
 * @param userId - The user ID to check
 * @returns true if user exists
 */
export async function userExistsById(userId: string): Promise<boolean> {
  if (!isValidUUID(userId)) {
    return false;
  }

  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error('[userExistsById] Error:', error);
    return false;
  }
}

/**
 * Create a follow relationship
 * 
 * @param followerId - The user who is following
 * @param followingId - The user being followed
 * @returns true if created (or already exists), false on error
 */
export async function createFollow(
  followerId: string,
  followingId: string
): Promise<boolean> {
  try {
    await db.insert(follows).values({
      followerId,
      followingId,
    });
    return true;
  } catch (error: unknown) {
    // Check for unique constraint violation (duplicate follow)
    // This is idempotent - if already following, that's success
    if (
      error instanceof Error &&
      error.message.includes('unique_follower_following')
    ) {
      return true;
    }
    console.error('[createFollow] Error:', error);
    return false;
  }
}

/**
 * Delete a follow relationship
 * 
 * @param followerId - The user who is following
 * @param followingId - The user being followed
 * @returns true (idempotent - always succeeds)
 */
export async function deleteFollow(
  followerId: string,
  followingId: string
): Promise<boolean> {
  try {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return true;
  } catch (error) {
    console.error('[deleteFollow] Error:', error);
    return false;
  }
}

