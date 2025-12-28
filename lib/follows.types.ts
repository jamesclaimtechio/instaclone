/**
 * Follow System Types
 * 
 * Client-safe types for the follow system.
 * This file contains NO database imports and can be safely used in client components.
 */

// ============================================================================
// ACTION RESULT TYPES
// ============================================================================

/**
 * Result returned from follow/unfollow Server Actions
 */
export interface FollowActionResult {
  success: boolean;
  /** Target user's follower count after action */
  followerCount?: number;
  /** Current user's following count after action */
  followingCount?: number;
  /** Whether current user is now following the target */
  isFollowing?: boolean;
  /** Error message if success is false */
  error?: string;
}

// ============================================================================
// COUNT TYPES
// ============================================================================

/**
 * Follower and following counts for a user
 */
export interface FollowCounts {
  /** Number of users following this user */
  followers: number;
  /** Number of users this user is following */
  following: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

