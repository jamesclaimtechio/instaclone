'use server';

import { getCurrentUser } from '@/lib/auth';
import { processImage, generateUniqueFilename, MAX_FILE_SIZE } from '@/lib/image';
import {
  uploadToR2,
  deleteFromR2,
  constructObjectKey,
  R2_FOLDERS,
} from '@/lib/r2';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a successful image upload
 */
export interface UploadSuccess {
  success: true;
  /** Public URL for full-size image (1200px) */
  imageUrl: string;
  /** Public URL for thumbnail (400px) */
  thumbnailUrl: string;
  /** Base64 blur placeholder for loading states */
  blurHash: string;
}

/**
 * Result of a failed image upload
 */
export interface UploadError {
  success: false;
  error: string;
}

/**
 * Combined result type for upload operations
 */
export type UploadResult = UploadSuccess | UploadError;

// ============================================================================
// MAIN UPLOAD FUNCTION
// ============================================================================

/**
 * Uploads an image from FormData, processes it into multiple sizes,
 * and stores all versions in R2.
 * 
 * This Server Action handles:
 * - Authentication check
 * - FormData extraction
 * - Image processing (thumbnail, full-size, blur)
 * - R2 upload with rollback on partial failure
 * 
 * @param formData - FormData containing 'image' field with the file
 * @returns Upload result with URLs on success, or error message on failure
 * 
 * @example
 * ```typescript
 * // Client-side usage
 * const formData = new FormData();
 * formData.append('image', file);
 * 
 * const result = await uploadImage(formData);
 * if (result.success) {
 *   console.log('Full:', result.imageUrl);
 *   console.log('Thumb:', result.thumbnailUrl);
 *   console.log('Blur:', result.blurHash);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    // =========================================================================
    // STEP 1: Authentication Check
    // =========================================================================
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please log in to upload images.',
      };
    }

    // =========================================================================
    // STEP 2: Extract File from FormData
    // =========================================================================
    const file = formData.get('image') as File | null;

    if (!file) {
      return {
        success: false,
        error: 'No file provided.',
      };
    }

    if (file.size === 0) {
      return {
        success: false,
        error: 'No file provided.',
      };
    }

    // Early size check before converting to buffer
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      };
    }

    // Convert File to Buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // =========================================================================
    // STEP 3: Process Image (generate 3 versions)
    // =========================================================================
    const processingResult = await processImage(buffer);

    if (!processingResult.success) {
      return {
        success: false,
        error: processingResult.error,
      };
    }

    const { thumbnailBuffer, fullSizeBuffer, blurDataUrl } = processingResult.data;

    // =========================================================================
    // STEP 4: Generate Unique Filename
    // =========================================================================
    const filename = generateUniqueFilename(file.name);
    const thumbnailKey = constructObjectKey(R2_FOLDERS.THUMBNAILS, filename);
    const fullSizeKey = constructObjectKey(R2_FOLDERS.FULL_SIZE, filename);

    // =========================================================================
    // STEP 5: Upload to R2 (with rollback on partial failure)
    // =========================================================================
    let thumbnailUrl: string;
    let imageUrl: string;

    // Upload thumbnail first
    try {
      thumbnailUrl = await uploadToR2(thumbnailKey, thumbnailBuffer, 'image/jpeg');
    } catch (error) {
      console.error('[Upload] Thumbnail upload failed:', error);
      return {
        success: false,
        error: 'Upload failed. Please try again.',
      };
    }

    // Upload full-size (with rollback if it fails)
    try {
      imageUrl = await uploadToR2(fullSizeKey, fullSizeBuffer, 'image/jpeg');
    } catch (error) {
      console.error('[Upload] Full-size upload failed:', error);
      
      // Attempt to clean up the thumbnail that was already uploaded
      try {
        await deleteFromR2(thumbnailKey);
        console.log('[Upload] Cleaned up orphaned thumbnail');
      } catch (cleanupError) {
        // Log but don't fail - the main error is the upload failure
        console.error('[Upload] Failed to cleanup thumbnail:', cleanupError);
      }

      return {
        success: false,
        error: 'Upload failed. Please try again.',
      };
    }

    // =========================================================================
    // STEP 6: Return Success
    // =========================================================================
    console.log('[Upload] Success:', {
      user: user.userId,
      filename,
      thumbnailUrl,
      imageUrl,
    });

    return {
      success: true,
      imageUrl,
      thumbnailUrl,
      blurHash: blurDataUrl,
    };

  } catch (error: any) {
    // Handle NEXT_REDIRECT (re-throw to let Next.js handle it)
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Upload] Unexpected error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

// ============================================================================
// PROFILE PICTURE UPLOAD
// ============================================================================

/**
 * Uploads a profile picture. Similar to uploadImage but uses the
 * profile-pictures folder and only needs the full-size version.
 * 
 * @param formData - FormData containing 'image' field with the file
 * @returns Upload result with single imageUrl on success
 */
export async function uploadProfilePicture(formData: FormData): Promise<UploadResult> {
  try {
    // Authentication check
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please log in to upload images.',
      };
    }

    // Extract file
    const file = formData.get('image') as File | null;

    if (!file || file.size === 0) {
      return {
        success: false,
        error: 'No file provided.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      };
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image
    const processingResult = await processImage(buffer);

    if (!processingResult.success) {
      return {
        success: false,
        error: processingResult.error,
      };
    }

    // For profile pictures, we use the thumbnail size (400px) as the main image
    // This is sufficient for profile pictures and saves storage
    const { thumbnailBuffer, blurDataUrl } = processingResult.data;

    // Generate unique filename and upload
    const filename = generateUniqueFilename(file.name);
    const profilePicKey = constructObjectKey(R2_FOLDERS.PROFILE_PICTURES, filename);

    let imageUrl: string;

    try {
      imageUrl = await uploadToR2(profilePicKey, thumbnailBuffer, 'image/jpeg');
    } catch (error) {
      console.error('[Upload] Profile picture upload failed:', error);
      return {
        success: false,
        error: 'Upload failed. Please try again.',
      };
    }

    console.log('[Upload] Profile picture success:', {
      user: user.userId,
      filename,
      imageUrl,
    });

    return {
      success: true,
      imageUrl,
      thumbnailUrl: imageUrl, // Same URL for profile pictures
      blurHash: blurDataUrl,
    };

  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Upload] Profile picture unexpected error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

// ============================================================================
// DELETE UPLOADED IMAGE
// ============================================================================

/**
 * Deletes an uploaded image and its thumbnail from R2.
 * Used when deleting posts or updating profile pictures.
 * 
 * @param imageUrl - The full-size image URL to delete
 * @param thumbnailUrl - The thumbnail URL to delete (optional)
 * @returns Success status
 */
export async function deleteUploadedImage(
  imageUrl: string,
  thumbnailUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Authentication check
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        success: false,
        error: 'Authentication required.',
      };
    }

    // Extract object keys from URLs and delete
    const results = await Promise.allSettled([
      deleteFromR2(imageUrl),
      thumbnailUrl ? deleteFromR2(thumbnailUrl) : Promise.resolve(true),
    ]);

    // Check if any deletions failed
    const failures = results.filter((r) => r.status === 'rejected');
    
    if (failures.length > 0) {
      console.warn('[Upload] Some deletions failed:', failures);
    }

    return { success: true };
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Upload] Delete error:', error);
    return {
      success: false,
      error: 'Failed to delete image.',
    };
  }
}

