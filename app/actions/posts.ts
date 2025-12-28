'use server';

import { getCurrentUser } from '@/lib/auth';
import {
  createPostInDb,
  getPostById,
  getFeedPosts,
  isValidR2Url,
  validatePostOwnership,
  type FeedPost,
  type FeedResponse,
  type FeedPaginationOptions,
} from '@/lib/posts';
import { deleteFromR2, extractObjectKeyFromUrl } from '@/lib/r2';
import { db, posts } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for creating a new post
 */
export interface CreatePostData {
  imageUrl: string;
  thumbnailUrl: string;
  blurHash: string;
  caption?: string;
}

/**
 * Result of post creation
 */
export type CreatePostResult =
  | { success: true; post: FeedPost }
  | { success: false; error: string };

/**
 * Result of getting a post
 */
export type GetPostResult =
  | { success: true; post: FeedPost }
  | { success: false; error: string };

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Creates a new post with the given image URLs and caption
 * 
 * @param data - Post creation data including image URLs and optional caption
 * @returns Created post or error
 * 
 * @example
 * ```typescript
 * const result = await createPost({
 *   imageUrl: 'https://r2.example.com/full/abc123.jpg',
 *   thumbnailUrl: 'https://r2.example.com/thumbnails/abc123.jpg',
 *   blurHash: 'data:image/jpeg;base64,...',
 *   caption: 'My awesome photo!',
 * });
 * 
 * if (result.success) {
 *   console.log('Post created:', result.post.id);
 * }
 * ```
 */
export async function createPost(data: CreatePostData): Promise<CreatePostResult> {
  try {
    // =========================================================================
    // STEP 1: Authentication Check
    // =========================================================================
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to create a post.',
      };
    }

    // =========================================================================
    // STEP 2: Validate Required Fields
    // =========================================================================
    const { imageUrl, thumbnailUrl, blurHash, caption } = data;

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return {
        success: false,
        error: 'Image URL is required.',
      };
    }

    if (!thumbnailUrl || typeof thumbnailUrl !== 'string' || thumbnailUrl.trim() === '') {
      return {
        success: false,
        error: 'Thumbnail URL is required.',
      };
    }

    if (!blurHash || typeof blurHash !== 'string' || blurHash.trim() === '') {
      return {
        success: false,
        error: 'Blur hash is required.',
      };
    }

    // =========================================================================
    // STEP 3: Validate URLs
    // =========================================================================
    if (!isValidR2Url(imageUrl)) {
      return {
        success: false,
        error: 'Invalid image URL.',
      };
    }

    if (!isValidR2Url(thumbnailUrl)) {
      return {
        success: false,
        error: 'Invalid thumbnail URL.',
      };
    }

    // =========================================================================
    // STEP 4: Validate BlurHash Length
    // =========================================================================
    // BlurHash should be a base64 data URL, typically 500-2000 bytes
    if (blurHash.length > 10000) {
      return {
        success: false,
        error: 'Blur hash is too large.',
      };
    }

    // =========================================================================
    // STEP 5: Create Post in Database
    // =========================================================================
    const post = await createPostInDb({
      userId: currentUser.userId,
      imageUrl: imageUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      blurHash: blurHash.trim(),
      caption: caption?.trim() || null,
    });

    console.log('[Posts] Created post:', {
      id: post.id,
      userId: currentUser.userId,
    });

    // =========================================================================
    // STEP 6: Revalidate Feed Cache
    // =========================================================================
    revalidatePath('/');
    revalidatePath('/feed');
    revalidatePath(`/profile/${post.author.username}`);

    return {
      success: true,
      post,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Posts] Error creating post:', error);
    return {
      success: false,
      error: 'Failed to create post. Please try again.',
    };
  }
}

/**
 * Gets a post by ID (Server Action wrapper for getPostById)
 * 
 * @param postId - The UUID of the post to fetch
 * @returns The post or error
 */
export async function getPost(postId: string): Promise<GetPostResult> {
  try {
    // Get current user for like status
    const currentUser = await getCurrentUser();
    const post = await getPostById(postId, currentUser?.userId);
    
    if (!post) {
      return {
        success: false,
        error: 'Post not found.',
      };
    }

    return {
      success: true,
      post,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Posts] Error getting post:', error);
    return {
      success: false,
      error: 'Failed to get post. Please try again.',
    };
  }
}

// ============================================================================
// FEED ACTIONS
// ============================================================================

/**
 * Cursor data for pagination - serializable for client/server transfer
 */
export interface SerializedCursor {
  createdAt: string; // ISO date string
  id: string;
}

/**
 * Load more posts for infinite scroll
 * 
 * @param cursor - The cursor from the previous page (optional for first page)
 * @param limit - Number of posts to fetch (optional, defaults to 25)
 * @returns Feed response with posts and pagination info
 */
export async function loadMorePosts(
  cursor?: SerializedCursor,
  limit?: number
): Promise<FeedResponse> {
  try {
    // Get current user for like status
    const currentUser = await getCurrentUser();
    
    const options = {
      limit,
      currentUserId: currentUser?.userId,
      cursor: cursor
        ? {
            createdAt: new Date(cursor.createdAt),
            id: cursor.id,
          }
        : undefined,
    };

    const response = await getFeedPosts(options);
    return response;
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Posts] Error loading feed:', error);
    // Return empty response on error
    return {
      posts: [],
      hasMore: false,
    };
  }
}

// ============================================================================
// DELETE ACTIONS
// ============================================================================

/**
 * Result of post deletion
 */
export type DeletePostResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Deletes a post and its associated R2 images
 * 
 * @param postId - The UUID of the post to delete
 * @returns Success or error result
 * 
 * @example
 * ```typescript
 * const result = await deletePost('abc123-uuid');
 * 
 * if (result.success) {
 *   router.push('/');
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function deletePost(postId: string): Promise<DeletePostResult> {
  try {
    // =========================================================================
    // STEP 1: Authentication Check
    // =========================================================================
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to delete a post.',
      };
    }

    // =========================================================================
    // STEP 2: Fetch Post and Verify Ownership
    // =========================================================================
    const post = await getPostById(postId, currentUser.userId);
    
    if (!post) {
      return {
        success: false,
        error: 'Post not found.',
      };
    }

    // Check if user owns the post
    if (!validatePostOwnership(currentUser.userId, post)) {
      console.warn('[Posts] Unauthorized delete attempt:', {
        postId,
        postOwnerId: post.userId,
        attemptingUserId: currentUser.userId,
      });
      return {
        success: false,
        error: 'You can only delete your own posts.',
      };
    }

    // =========================================================================
    // STEP 3: Delete from Database (cascades to likes/comments)
    // =========================================================================
    await db.delete(posts).where(eq(posts.id, postId));

    console.log('[Posts] Post deleted:', {
      postId,
      userId: currentUser.userId,
    });

    // =========================================================================
    // STEP 4: Clean up R2 Images (best effort, non-blocking)
    // =========================================================================
    // Don't fail the delete if R2 cleanup fails
    try {
      const imageKey = extractObjectKeyFromUrl(post.imageUrl);
      const thumbnailKey = extractObjectKeyFromUrl(post.thumbnailUrl);

      if (imageKey) {
        await deleteFromR2(imageKey);
      }
      if (thumbnailKey) {
        await deleteFromR2(thumbnailKey);
      }

      console.log('[Posts] R2 images cleaned up:', { imageKey, thumbnailKey });
    } catch (r2Error) {
      // Log but don't fail the deletion
      console.error('[Posts] R2 cleanup failed (non-critical):', r2Error);
    }

    // =========================================================================
    // STEP 5: Revalidate Caches
    // =========================================================================
    revalidatePath('/');
    revalidatePath('/feed');
    revalidatePath(`/profile/${post.author.username}`);
    revalidatePath(`/post/${postId}`);

    return {
      success: true,
    };
  } catch (error: any) {
    // Handle NEXT_REDIRECT
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Posts] Error deleting post:', error);
    return {
      success: false,
      error: 'Failed to delete post. Please try again.',
    };
  }
}

