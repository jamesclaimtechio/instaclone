/**
 * Search Types
 * 
 * Client-safe types for the user search feature.
 * This file contains NO database imports and can be safely used in client components.
 */

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * A single search result representing a user
 */
export interface SearchResult {
  /** User's unique ID */
  id: string;
  /** User's username */
  username: string;
  /** User's profile picture URL (null if not set) */
  profilePictureUrl: string | null;
}

/**
 * Response from the searchUsers Server Action
 */
export interface SearchResponse {
  /** Whether the search was successful */
  success: boolean;
  /** Array of matching users (max 10) */
  results: SearchResult[];
  /** Error message if success is false */
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of search results to return */
export const MAX_SEARCH_RESULTS = 10;

/** Maximum query string length */
export const MAX_QUERY_LENGTH = 50;

/** Minimum query string length */
export const MIN_QUERY_LENGTH = 1;

