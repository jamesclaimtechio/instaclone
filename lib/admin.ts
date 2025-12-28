/**
 * Admin Dashboard Data Layer
 * 
 * Server-only query functions for admin features.
 * Contains database operations - do NOT import in client components.
 */

import { db, users, posts, comments } from '@/db';
import { count } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
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

