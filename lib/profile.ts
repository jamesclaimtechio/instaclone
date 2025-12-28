import { db, users, posts, follows } from '@/db';
import { eq, desc, lt, sql, count } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Public user fields only - never expose passwordHash, email, emailVerified, isAdmin
 */
export type ProfileUser = {
  id: string;
  username: string;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
};

/**
 * Profile statistics - follower, following, and posts counts
 */
export type ProfileStats = {
  followers: number;
  following: number;
  posts: number;
};

/**
 * Post data for profile grid display
 */
export type ProfilePost = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  blurHash: string;
  caption: string | null;
  createdAt: Date;
};

/**
 * Paginated posts response with cursor for next page
 */
export type ProfilePostsResponse = {
  posts: ProfilePost[];
  nextCursor: Date | null;
  hasMore: boolean;
};

/**
 * Complete profile data combining user, stats, posts, and ownership
 */
export type ProfileData = {
  user: ProfileUser;
  stats: ProfileStats;
  posts: ProfilePostsResponse;
  isOwnProfile: boolean;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_POSTS_LIMIT = 20;

// DiceBear API for generating consistent default avatars from username
// Using "initials" style - shows first letter(s) of username
const DICEBEAR_BASE_URL = 'https://api.dicebear.com/7.x/initials/svg';

// ============================================================================
// CORE QUERIES
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
    : null;

  return {
    posts: postsToReturn,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if the current user is viewing their own profile
 * 
 * @param currentUserId - The ID of the currently logged in user (null if not logged in)
 * @param profileUserId - The ID of the profile being viewed
 * @returns true if viewing own profile, false otherwise
 */
export function isOwnProfile(currentUserId: string | null, profileUserId: string): boolean {
  if (!currentUserId) {
    return false;
  }
  return currentUserId === profileUserId;
}

/**
 * Generates a consistent default avatar URL using DiceBear API
 * Uses the "initials" style which shows first letter(s) of the username
 * 
 * @param username - The username to generate avatar for
 * @returns URL to the generated avatar SVG
 */
export function getDefaultAvatarUrl(username: string): string {
  // Encode username for URL safety
  const encodedSeed = encodeURIComponent(username);
  
  // Use a pleasant background color palette
  // DiceBear initials style generates colors based on the seed
  return `${DICEBEAR_BASE_URL}?seed=${encodedSeed}&backgroundColor=c0aede,d1d4f9,ffd5dc,ffdfbf,b6e3f4&backgroundType=gradientLinear`;
}

/**
 * Returns the appropriate avatar URL - profile picture if exists, default otherwise
 * 
 * @param profilePictureUrl - The user's profile picture URL (may be null)
 * @param username - The username (used for generating default avatar)
 * @returns URL to display as avatar
 */
export function getAvatarUrl(profilePictureUrl: string | null, username: string): string {
  if (profilePictureUrl && profilePictureUrl.trim().length > 0) {
    return profilePictureUrl;
  }
  return getDefaultAvatarUrl(username);
}

// ============================================================================
// COMBINED FETCHER
// ============================================================================

/**
 * Fetches complete profile data for a user
 * Combines user info, stats, posts, and ownership flag into single response
 * 
 * @param username - The username to fetch profile for
 * @param currentUserId - Optional current user ID for ownership detection
 * @returns ProfileData object or null if user not found
 */
export async function getFullProfile(
  username: string,
  currentUserId?: string | null
): Promise<ProfileData | null> {
  // First, fetch the user - if not found, return null for 404
  const user = await getProfileByUsername(username);
  
  if (!user) {
    return null;
  }

  // User exists - fetch stats and posts in parallel
  const [stats, postsResponse] = await Promise.all([
    getProfileStats(user.id),
    getProfilePosts(user.id),
  ]);

  return {
    user,
    stats,
    posts: postsResponse,
    isOwnProfile: isOwnProfile(currentUserId ?? null, user.id),
  };
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

