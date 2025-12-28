/**
 * Search Data Layer
 * 
 * Server-only query functions for user search.
 * Contains database operations - do NOT import in client components.
 */

import { db, users } from '@/db';
import { ilike, sql } from 'drizzle-orm';

// Re-export types for convenience
export * from './search.types';

// Import types and constants
import { 
  type SearchResult, 
  MAX_SEARCH_RESULTS, 
  MAX_QUERY_LENGTH, 
  MIN_QUERY_LENGTH 
} from './search.types';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Escape special characters for ILIKE pattern matching
 * PostgreSQL ILIKE treats %, _, and \ as special characters
 * 
 * @param query - Raw query string
 * @returns Escaped query string safe for ILIKE
 */
export function escapeILikePattern(query: string): string {
  return query
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')     // Escape percent
    .replace(/_/g, '\\_');    // Escape underscore
}

/**
 * Validate and sanitize search query
 * 
 * @param query - Raw query string
 * @returns Sanitized query or null if invalid
 */
export function validateSearchQuery(query: string): string | null {
  // Trim whitespace
  const trimmed = query.trim();
  
  // Check length constraints
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return null;
  }
  
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return trimmed.slice(0, MAX_QUERY_LENGTH);
  }
  
  return trimmed;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Search users by username with case-insensitive partial matching
 * 
 * Features:
 * - Case-insensitive (ILIKE)
 * - Partial matching (contains)
 * - Exact matches prioritized
 * - Limited to MAX_SEARCH_RESULTS
 * - Special characters escaped
 * 
 * @param query - Search query string
 * @param limit - Maximum results (default: MAX_SEARCH_RESULTS)
 * @returns Array of matching users
 */
export async function searchUsersByUsername(
  query: string,
  limit: number = MAX_SEARCH_RESULTS
): Promise<SearchResult[]> {
  // Validate query
  const validatedQuery = validateSearchQuery(query);
  
  if (!validatedQuery) {
    return [];
  }
  
  // Escape special ILIKE characters
  const escapedQuery = escapeILikePattern(validatedQuery);
  const pattern = `%${escapedQuery}%`;
  
  try {
    // Query with ILIKE for case-insensitive partial matching
    // Order by exact match first, then alphabetically
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(ilike(users.username, pattern))
      .orderBy(
        // Exact matches first (case-insensitive)
        sql`CASE WHEN LOWER(${users.username}) = LOWER(${validatedQuery}) THEN 0 ELSE 1 END`,
        // Then alphabetically
        users.username
      )
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error('[searchUsersByUsername] Error:', error);
    return [];
  }
}

