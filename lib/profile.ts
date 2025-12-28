import { db, users, posts, follows } from '@/db';
import { eq, desc, sql, count, and } from 'drizzle-orm';

// Re-export types and utilities from the client-safe file
export * from './profile.types';

// Import types for use in this file
import type {
  ProfileUser,
  ProfileStats,
  ProfilePost,
  ProfilePostsResponse,
  ProfileData,
} from './profile.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_POSTS_LIMIT = 20;

// ============================================================================
// CORE QUERIES (Server-only - requires database)
// ============================================================================

/**
 * Fetches a user by username (case-sensitive per spec)
 * Returns only public fields, never passwordHash, email, etc.
 * 
 * @param username - The exact username to look up
 * @returns ProfileUser object or null if not found
 */
export async function getProfileByUsername(username: string): Promise<ProfileUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      bio: true,
      profilePictureUrl: true,
      createdAt: true,
      // Explicitly exclude sensitive fields by only selecting public ones
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

/**
 * Fetches profile statistics (followers, following, posts counts)
 * Runs all three COUNT queries in parallel for performance
 * 
 * @param userId - The user ID to get stats for
 * @returns ProfileStats object with counts
 */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  // Run all COUNT queries in parallel for better performance
  const [followersResult, followingResult, postsResult] = await Promise.all([
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
    
    // Posts: count of posts by this user
    db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId)),
  ]);

  return {
    followers: followersResult[0]?.count ?? 0,
    following: followingResult[0]?.count ?? 0,
    posts: postsResult[0]?.count ?? 0,
  };
}

/**
 * Fetches a user's posts with cursor-based pagination
 * Posts are ordered by createdAt DESC (newest first)
 * 
 * @param userId - The user ID to get posts for
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Optional cursor for pagination (createdAt of last post from previous page)
 * @returns ProfilePostsResponse with posts array, next cursor, and hasMore flag
 */
export async function getProfilePosts(
  userId: string,
  limit: number = DEFAULT_POSTS_LIMIT,
  cursor?: Date
): Promise<ProfilePostsResponse> {
  // Build query conditions
  const conditions = cursor
    ? sql`${posts.userId} = ${userId} AND ${posts.createdAt} < ${cursor}`
    : eq(posts.userId, userId);

  // Fetch one extra to determine if there are more posts
  const fetchLimit = limit + 1;

  const userPosts = await db
    .select({
      id: posts.id,
      imageUrl: posts.imageUrl,
      thumbnailUrl: posts.thumbnailUrl,
      blurHash: posts.blurHash,
      caption: posts.caption,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(conditions)
    .orderBy(desc(posts.createdAt))
    .limit(fetchLimit);

  // Check if there are more posts beyond the limit
  const hasMore = userPosts.length > limit;
  
  // If we fetched more than limit, remove the extra post
  const postsToReturn = hasMore ? userPosts.slice(0, limit) : userPosts;

  // Get the cursor for the next page (createdAt of the last post)
  const nextCursor = postsToReturn.length > 0
    ? postsToReturn[postsToReturn.length - 1]!.createdAt
    : undefined;

  return {
    posts: postsToReturn,
    nextCursor: hasMore ? nextCursor : undefined,
    hasMore,
  };
}

// ============================================================================
// COMBINED FETCHER
// ============================================================================

/**
 * Fetches complete profile data for a user
 * Combines user info, stats, posts, ownership flag, and follow status into single response
 * 
 * @param username - The username to fetch profile for
 * @param currentUserId - Optional current user ID for ownership detection and follow status
 * @returns ProfileData object or null if user not found
 */
export async function getFullProfile(
  username: string,
  currentUserId?: string | null
): Promise<ProfileData | null> {
  // Import isOwnProfile from the types file
  const { isOwnProfile } = await import('./profile.types');
  
  // First, fetch the user - if not found, return null for 404
  const user = await getProfileByUsername(username);
  
  if (!user) {
    return null;
  }

  // Check if viewing own profile
  const viewingOwnProfile = isOwnProfile(currentUserId ?? null, user.id);

  // User exists - fetch stats, posts, and optionally follow status in parallel
  const [stats, postsResponse, isFollowing] = await Promise.all([
    getProfileStats(user.id),
    getProfilePosts(user.id),
    // Only check follow status if logged in and not viewing own profile
    currentUserId && !viewingOwnProfile
      ? getFollowStatus(currentUserId, user.id)
      : Promise.resolve(undefined),
  ]);

  return {
    user,
    stats,
    posts: postsResponse.posts,
    isOwnProfile: viewingOwnProfile,
    isFollowing,
  };
}

/**
 * Check if a user is following another user
 * 
 * @param followerId - The user who may be following
 * @param followingId - The user who may be followed
 * @returns true if following, false otherwise
 */
async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<boolean> {
  try {
    const result = await db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
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
 * Quick check if a username exists (for validation purposes)
 * More efficient than fetching full profile when only checking existence
 * 
 * @param username - The username to check
 * @returns true if username exists, false otherwise
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result.length > 0;
}
