'use client';

// ============================================================================
// COMMENT TYPES (Client-safe - no database imports)
// ============================================================================

/**
 * Comment author information
 */
export interface CommentAuthor {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

/**
 * A comment on a post with author information
 */
export interface PostComment {
  id: string;
  text: string;
  author: CommentAuthor;
  createdAt: Date;
}

/**
 * Result of a comment create/delete operation
 */
export interface CommentActionResult {
  success: boolean;
  comment?: PostComment;
  commentCount: number;
  error?: string;
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Formats a comment timestamp for display
 * Shows relative time for recent comments, date for older ones
 * 
 * @param date - The comment creation date
 * @returns Formatted time string
 */
export function formatCommentTimestamp(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  // Less than a year
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 52) {
    return `${diffInWeeks}w`;
  }

  // More than a year - show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Gets avatar URL with fallback to DiceBear
 */
export function getCommentAvatarUrl(profilePictureUrl: string | null, username: string): string {
  return profilePictureUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;
}

