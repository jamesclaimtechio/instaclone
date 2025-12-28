// ============================================================================
// POST TYPES - Safe to import in client components
// ============================================================================

/**
 * Author information embedded in a post
 */
export interface PostAuthor {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

/**
 * Complete post data with author information for feed display
 */
export interface FeedPost {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  blurHash: string;
  createdAt: Date;
  userId: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
}

/**
 * Input for creating a new post
 */
export interface CreatePostInput {
  userId: string;
  imageUrl: string;
  thumbnailUrl: string;
  blurHash: string;
  caption?: string | null;
}

/**
 * Pagination options for feed queries
 */
export interface FeedPaginationOptions {
  limit?: number;
  cursor?: {
    createdAt: Date;
    id: string;
  };
}

/**
 * Response from paginated feed queries
 */
export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  nextCursor?: {
    createdAt: Date;
    id: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default number of posts per page */
export const DEFAULT_FEED_LIMIT = 25;

/** Maximum allowed posts per page */
export const MAX_FEED_LIMIT = 30;

// ============================================================================
// UTILITIES - Safe to use in client components
// ============================================================================

/**
 * Validates if a user owns a specific post
 * 
 * @param userId - The user ID to check
 * @param post - The post object with userId
 * @returns true if user owns the post
 */
export function validatePostOwnership(
  userId: string,
  post: { userId: string }
): boolean {
  return userId === post.userId;
}

/**
 * Validates if a string is a valid R2 URL
 * 
 * @param url - The URL to validate
 * @returns true if URL matches R2 pattern
 */
export function isValidR2Url(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Accept any HTTPS URL for now (could restrict to R2 domain if configured)
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Formats a post's relative timestamp for display
 * 
 * @param date - The date to format
 * @returns Human-readable relative time string
 */
export function formatPostTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    // For older posts, show the date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

