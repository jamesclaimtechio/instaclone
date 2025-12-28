import { db, posts, users, likes, comments } from '@/db';
import { eq, desc, sql, and, lt } from 'drizzle-orm';

// ============================================================================
// TYPES
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
// POST QUERIES
// ============================================================================

/**
 * Gets a single post by ID with author information and counts
 * 
 * @param postId - The UUID of the post to fetch
 * @returns The post with author info, or null if not found
 */
export async function getPostById(postId: string): Promise<FeedPost | null> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      return null;
    }

    const result = await db
      .select({
        id: posts.id,
        imageUrl: posts.imageUrl,
        thumbnailUrl: posts.thumbnailUrl,
        caption: posts.caption,
        blurHash: posts.blurHash,
        createdAt: posts.createdAt,
        userId: posts.userId,
        authorId: users.id,
        authorUsername: users.username,
        authorProfilePictureUrl: users.profilePictureUrl,
        likeCount: sql<number>`COALESCE((SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id}), 0)::int`,
        commentCount: sql<number>`COALESCE((SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id}), 0)::int`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);

    const row = result[0];
    
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      imageUrl: row.imageUrl,
      thumbnailUrl: row.thumbnailUrl,
      caption: row.caption,
      blurHash: row.blurHash,
      createdAt: row.createdAt,
      userId: row.userId,
      author: {
        id: row.authorId || row.userId,
        username: row.authorUsername || 'Deleted User',
        profilePictureUrl: row.authorProfilePictureUrl,
      },
      likeCount: row.likeCount,
      commentCount: row.commentCount,
    };
  } catch (error) {
    console.error('[Posts] Error fetching post by ID:', error);
    return null;
  }
}

/**
 * Creates a new post in the database
 * 
 * @param input - Post creation data
 * @returns The created post with author info
 */
export async function createPostInDb(input: CreatePostInput): Promise<FeedPost> {
  const { userId, imageUrl, thumbnailUrl, blurHash, caption } = input;

  // Insert the post
  const insertResult = await db
    .insert(posts)
    .values({
      userId,
      imageUrl,
      thumbnailUrl,
      blurHash,
      caption: caption || null, // Store empty string as null
    })
    .returning();

  const newPost = insertResult[0];
  
  if (!newPost) {
    throw new Error('Failed to create post');
  }

  // Fetch the author info
  const author = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      profilePictureUrl: true,
    },
  });

  return {
    id: newPost.id,
    imageUrl: newPost.imageUrl,
    thumbnailUrl: newPost.thumbnailUrl,
    caption: newPost.caption,
    blurHash: newPost.blurHash,
    createdAt: newPost.createdAt,
    userId: newPost.userId,
    author: {
      id: author?.id || userId,
      username: author?.username || 'Unknown',
      profilePictureUrl: author?.profilePictureUrl || null,
    },
    likeCount: 0,
    commentCount: 0,
  };
}

/**
 * Fetches paginated posts for the global feed
 * Ordered by createdAt DESC (newest first)
 * 
 * @param options - Pagination options
 * @returns Paginated feed response
 */
export async function getFeedPosts(options: FeedPaginationOptions = {}): Promise<FeedResponse> {
  const limit = Math.min(options.limit || DEFAULT_FEED_LIMIT, MAX_FEED_LIMIT);
  
  // Fetch one extra to check if there are more
  const queryLimit = limit + 1;

  // Build the base query
  const selectFields = {
    id: posts.id,
    imageUrl: posts.imageUrl,
    thumbnailUrl: posts.thumbnailUrl,
    caption: posts.caption,
    blurHash: posts.blurHash,
    createdAt: posts.createdAt,
    userId: posts.userId,
    authorId: users.id,
    authorUsername: users.username,
    authorProfilePictureUrl: users.profilePictureUrl,
    likeCount: sql<number>`COALESCE((SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id}), 0)::int`,
    commentCount: sql<number>`COALESCE((SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id}), 0)::int`,
  };

  // Execute query with or without cursor
  const result = options.cursor
    ? await db
        .select(selectFields)
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(
          sql`(${posts.createdAt}, ${posts.id}) < (${options.cursor.createdAt}, ${options.cursor.id})`
        )
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(queryLimit)
    : await db
        .select(selectFields)
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(queryLimit);

  // Check if there are more posts
  const hasMore = result.length > limit;
  const postsToReturn = hasMore ? result.slice(0, limit) : result;

  // Build the response
  const feedPosts: FeedPost[] = postsToReturn.map((row) => ({
    id: row.id,
    imageUrl: row.imageUrl,
    thumbnailUrl: row.thumbnailUrl,
    caption: row.caption,
    blurHash: row.blurHash,
    createdAt: row.createdAt,
    userId: row.userId,
    author: {
      id: row.authorId || row.userId,
      username: row.authorUsername || 'Deleted User',
      profilePictureUrl: row.authorProfilePictureUrl,
    },
    likeCount: row.likeCount,
    commentCount: row.commentCount,
  }));

  // Build next cursor from last post
  const lastPost = postsToReturn[postsToReturn.length - 1];
  const nextCursor = hasMore && lastPost
    ? { createdAt: lastPost.createdAt, id: lastPost.id }
    : undefined;

  return {
    posts: feedPosts,
    hasMore,
    nextCursor,
  };
}

// ============================================================================
// UTILITIES
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

