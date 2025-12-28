// ============================================================================
// PROFILE TYPES - Safe to import in client components
// ============================================================================

/**
 * Basic user profile data (public info only)
 */
export interface ProfileUser {
  id: string;
  username: string;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
}

/**
 * Profile statistics
 */
export interface ProfileStats {
  followers: number;
  following: number;
  posts: number;
}

/**
 * Post data for profile grid display
 */
export interface ProfilePost {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  blurHash: string;
  caption?: string | null;
  createdAt: Date;
}

/**
 * Response for paginated profile posts
 */
export interface ProfilePostsResponse {
  posts: ProfilePost[];
  hasMore: boolean;
  nextCursor?: Date;
}

/**
 * Complete profile data for page display
 */
export interface ProfileData {
  user: ProfileUser;
  stats: ProfileStats;
  posts: ProfilePost[];
  isOwnProfile: boolean;
  /** Whether the current user is following this profile (undefined if not logged in or own profile) */
  isFollowing?: boolean;
}

// ============================================================================
// UTILITIES - Safe to use in client components
// ============================================================================

/**
 * Check if the current user is viewing their own profile
 * 
 * @param currentUserId - The authenticated user's ID (or null if not logged in)
 * @param profileUserId - The profile being viewed's user ID
 * @returns true if viewing own profile
 */
export function isOwnProfile(
  currentUserId: string | null,
  profileUserId: string
): boolean {
  return currentUserId !== null && currentUserId === profileUserId;
}

/**
 * Get a default avatar URL for users without a profile picture
 * Uses DiceBear for consistent, unique avatars
 * 
 * @param username - The user's username for avatar generation
 * @returns URL to a default avatar image
 */
export function getDefaultAvatarUrl(username: string): string {
  // Using DiceBear's "initials" style for consistent avatars
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=c0aede,d1d4f9,b6e3f4,ffd5dc,ffdfbf`;
}

/**
 * Get the avatar URL for a user, falling back to default if not set
 * 
 * @param profilePictureUrl - The user's profile picture URL (or null)
 * @param username - The user's username for fallback
 * @returns The profile picture URL or a default avatar
 */
export function getAvatarUrl(
  profilePictureUrl: string | null,
  username: string
): string {
  return profilePictureUrl || getDefaultAvatarUrl(username);
}

/**
 * Format a count for display with compact notation
 * Examples:
 * - 0 → "0"
 * - 999 → "999"
 * - 1200 → "1.2K"
 * - 10000 → "10K"
 * - 1500000 → "1.5M"
 * 
 * @param count - The number to format
 * @returns Formatted string
 */
export function formatCount(count: number): string {
  // Ensure non-negative
  const safeCount = Math.max(0, count);
  
  if (safeCount < 1000) {
    return safeCount.toString();
  }
  
  if (safeCount < 10000) {
    // 1,000 - 9,999: Show one decimal (1.2K)
    return (safeCount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  if (safeCount < 1000000) {
    // 10,000 - 999,999: Round to nearest K (10K, 100K)
    return Math.round(safeCount / 1000) + 'K';
  }
  
  // 1,000,000+: Show one decimal (1.5M)
  return (safeCount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

