'use server';

import { getCurrentUser } from '@/lib/auth';
import {
  createPostInDb,
  getPostById,
  isValidR2Url,
  type FeedPost,
} from '@/lib/posts';
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
    const post = await getPostById(postId);
    
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

