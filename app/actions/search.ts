'use server';

/**
 * Search Server Actions
 * 
 * Handles user search with proper validation.
 * No authentication required for search.
 */

import { searchUsersByUsername, validateSearchQuery } from '@/lib/search';
import type { SearchResponse } from '@/lib/search.types';

// ============================================================================
// SEARCH USERS
// ============================================================================

/**
 * Search for users by username
 * 
 * Features:
 * - Case-insensitive partial matching
 * - Exact matches prioritized
 * - Max 10 results
 * - No authentication required
 * 
 * @param query - Search query string
 * @returns SearchResponse with matching users
 */
export async function searchUsers(query: string): Promise<SearchResponse> {
  try {
    // Validate query
    const validatedQuery = validateSearchQuery(query);
    
    if (!validatedQuery) {
      // Empty or invalid query - return empty results (not an error)
      return {
        success: true,
        results: [],
      };
    }
    
    // Execute search
    const results = await searchUsersByUsername(validatedQuery);
    
    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('[searchUsers] Error:', error);
    return {
      success: false,
      results: [],
      error: 'Search failed. Please try again.',
    };
  }
}

