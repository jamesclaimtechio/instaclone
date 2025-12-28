/**
 * Admin Dashboard Data Layer
 * 
 * Server-only query functions for admin features.
 * Contains database operations - do NOT import in client components.
 */

import { db, users, posts, comments, likes } from '@/db';
import { count, desc, eq, sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  profilePictureUrl: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

export interface AdminPost {
  id: string;
  thumbnailUrl: string;
  caption: string | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
  likeCount: number;
  commentCount: number;
}

export interface AdminComment {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
  post: {
    id: string;
    caption: string | null;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface UserCascadeStats {
  postCount: number;
  commentCount: number;
  likeCount: number;
}

export interface PostCascadeStats {
  likeCount: number;
  commentCount: number;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get admin dashboard stats
 * Fetches total counts for users, posts, and comments
 * 
 * @returns AdminStats with all counts
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Run all count queries in parallel for performance
    const [usersResult, postsResult, commentsResult] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(posts),
      db.select({ count: count() }).from(comments),
    ]);

    return {
      totalUsers: usersResult[0]?.count ?? 0,
      totalPosts: postsResult[0]?.count ?? 0,
      totalComments: commentsResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error('[getAdminStats] Error:', error);
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
    };
  }
}

/**
 * Get all users with pagination
 * Returns user info for admin list (no sensitive data like password hash)
 */
export async function getAllUsers(
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResult<AdminUser>> {
  try {
    const offset = (page - 1) * limit;

    // Run data query and count query in parallel
    const [usersData, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          profilePictureUrl: users.profilePictureUrl,
          isAdmin: users.isAdmin,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(users),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    return {
      items: usersData,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('[getAllUsers] Error:', error);
    return {
      items: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

/**
 * Get all posts with pagination
 * Includes author info, like count, and comment count
 */
export async function getAllPosts(
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResult<AdminPost>> {
  try {
    const offset = (page - 1) * limit;

    // Query posts with author info and counts using subqueries
    const [postsData, countResult] = await Promise.all([
      db
        .select({
          id: posts.id,
          thumbnailUrl: posts.thumbnailUrl,
          caption: posts.caption,
          createdAt: posts.createdAt,
          authorId: users.id,
          authorUsername: users.username,
          likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = ${posts.id})`.as('like_count'),
          commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = ${posts.id})`.as('comment_count'),
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(posts),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    // Transform to AdminPost shape
    const items: AdminPost[] = postsData.map((post) => ({
      id: post.id,
      thumbnailUrl: post.thumbnailUrl,
      caption: post.caption,
      createdAt: post.createdAt,
      author: {
        id: post.authorId ?? '',
        username: post.authorUsername ?? '[deleted]',
      },
      likeCount: Number(post.likeCount) || 0,
      commentCount: Number(post.commentCount) || 0,
    }));

    return {
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('[getAllPosts] Error:', error);
    return {
      items: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

/**
 * Get all comments with pagination
 * Includes author info and post context
 */
export async function getAllComments(
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResult<AdminComment>> {
  try {
    const offset = (page - 1) * limit;

    // Create aliases for the users table to join twice (author and post author)
    const [commentsData, countResult] = await Promise.all([
      db
        .select({
          id: comments.id,
          text: comments.text,
          createdAt: comments.createdAt,
          authorId: users.id,
          authorUsername: users.username,
          postId: posts.id,
          postCaption: posts.caption,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .leftJoin(posts, eq(comments.postId, posts.id))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(comments),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    // Transform to AdminComment shape
    const items: AdminComment[] = commentsData.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: {
        id: comment.authorId ?? '',
        username: comment.authorUsername ?? '[deleted]',
      },
      post: {
        id: comment.postId ?? '',
        caption: comment.postCaption,
      },
    }));

    return {
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('[getAllComments] Error:', error);
    return {
      items: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

// ============================================================================
// CASCADE STATS QUERIES (for delete confirmation)
// ============================================================================

/**
 * Get cascade stats for a user before deletion
 * Shows how many posts, comments, and likes will be deleted
 */
export async function getUserCascadeStats(userId: string): Promise<UserCascadeStats> {
  try {
    const [postResult, commentResult, likeResult] = await Promise.all([
      db.select({ count: count() }).from(posts).where(eq(posts.userId, userId)),
      db.select({ count: count() }).from(comments).where(eq(comments.userId, userId)),
      db.select({ count: count() }).from(likes).where(eq(likes.userId, userId)),
    ]);

    return {
      postCount: postResult[0]?.count ?? 0,
      commentCount: commentResult[0]?.count ?? 0,
      likeCount: likeResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error('[getUserCascadeStats] Error:', error);
    return {
      postCount: 0,
      commentCount: 0,
      likeCount: 0,
    };
  }
}

/**
 * Get cascade stats for a post before deletion
 * Shows how many likes and comments will be deleted
 */
export async function getPostCascadeStats(postId: string): Promise<PostCascadeStats> {
  try {
    const [likeResult, commentResult] = await Promise.all([
      db.select({ count: count() }).from(likes).where(eq(likes.postId, postId)),
      db.select({ count: count() }).from(comments).where(eq(comments.postId, postId)),
    ]);

    return {
      likeCount: likeResult[0]?.count ?? 0,
      commentCount: commentResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error('[getPostCascadeStats] Error:', error);
    return {
      likeCount: 0,
      commentCount: 0,
    };
  }
}

