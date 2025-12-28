import sharp from 'sharp';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/** Maximum file size: 50MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Thumbnail width: 400px (for grid views) */
export const THUMBNAIL_WIDTH = 400;

/** Full-size width: 1200px (for detail views) */
export const FULL_SIZE_WIDTH = 1200;

/** Blur placeholder width: 20px (for loading states) */
export const BLUR_WIDTH = 20;

/** Thumbnail JPEG quality: 80 */
export const THUMBNAIL_QUALITY = 80;

/** Full-size JPEG quality: 85 */
export const FULL_SIZE_QUALITY = 85;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of successful image processing
 */
export interface ProcessedImage {
  /** 400px width thumbnail buffer */
  thumbnailBuffer: Buffer;
  /** 1200px width full-size buffer */
  fullSizeBuffer: Buffer;
  /** Base64 data URL for blur placeholder (data:image/jpeg;base64,...) */
  blurDataUrl: string;
  /** Original image metadata */
  metadata: {
    originalWidth: number;
    originalHeight: number;
    format: string;
  };
}

/**
 * Result of image validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: sharp.Metadata;
}

/**
 * Result of image processing (success or error)
 */
export type ProcessingResult =
  | { success: true; data: ProcessedImage }
  | { success: false; error: string };

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validates that a buffer contains a valid image within size limits
 * 
 * @param buffer - The raw image buffer to validate
 * @returns Validation result with metadata if valid
 */
export async function validateImageFile(buffer: Buffer): Promise<ValidationResult> {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      error: 'No file provided.',
    };
  }

  try {
    // Sharp validates the image when reading metadata
    const metadata = await sharp(buffer).metadata();

    // Ensure we have dimensions (valid image)
    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Invalid image file. Could not read dimensions.',
      };
    }

    return {
      valid: true,
      metadata,
    };
  } catch (error: any) {
    // Map Sharp errors to user-friendly messages
    const errorMessage = mapSharpError(error);
    return {
      valid: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Maps Sharp error messages to user-friendly messages
 * 
 * @param error - The error thrown by Sharp
 * @returns User-friendly error message
 */
function mapSharpError(error: any): string {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('unsupported image format') || message.includes('input buffer contains unsupported')) {
    return 'Unsupported file type. Please use JPG, PNG, WebP, or GIF.';
  }

  if (message.includes('input file is missing') || message.includes('input is missing')) {
    return 'Invalid image file.';
  }

  if (message.includes('vips') || message.includes('heif')) {
    return 'This image format is not supported. Please convert to JPG or PNG.';
  }

  if (message.includes('memory') || message.includes('timeout')) {
    return 'Image processing failed. The file may be too large or corrupted.';
  }

  // Generic fallback
  console.error('[Image] Sharp error:', error);
  return 'Image processing failed. Please try a different file.';
}

// ============================================================================
// BLUR PLACEHOLDER
// ============================================================================

/**
 * Converts an image buffer to a base64 data URL
 * 
 * @param buffer - The image buffer to convert
 * @returns Base64 data URL string (data:image/jpeg;base64,...)
 */
function bufferToBlurDataUrl(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

// ============================================================================
// IMAGE PROCESSING PIPELINE
// ============================================================================

/**
 * Processes a raw image buffer into three optimized versions:
 * - Thumbnail (400px width, quality 80)
 * - Full-size (1200px width, quality 85)
 * - Blur placeholder (20px width, base64 encoded)
 * 
 * Handles EXIF orientation, alpha channel flattening, and prevents upscaling.
 * 
 * @param buffer - The raw image buffer to process
 * @returns Processing result with all three versions or an error
 * 
 * @example
 * ```typescript
 * const result = await processImage(imageBuffer);
 * if (result.success) {
 *   const { thumbnailBuffer, fullSizeBuffer, blurDataUrl } = result.data;
 *   // Upload buffers to R2...
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function processImage(buffer: Buffer): Promise<ProcessingResult> {
  // Step 1: Validate the input
  const validation = await validateImageFile(buffer);
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Invalid image file.',
    };
  }

  const metadata = validation.metadata!;

  try {
    // Step 2: Create the base Sharp instance with common transformations
    // - rotate(): Auto-rotate based on EXIF orientation
    // - flatten(): Convert alpha channel to white background
    const baseImage = sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .flatten({ background: '#ffffff' }); // White background for transparency

    // Step 3: Process all three versions in parallel
    const [thumbnailBuffer, fullSizeBuffer, blurBuffer] = await Promise.all([
      // Thumbnail: 400px width, JPEG quality 80
      baseImage
        .clone()
        .resize({
          width: THUMBNAIL_WIDTH,
          withoutEnlargement: true, // Don't upscale small images
        })
        .jpeg({ quality: THUMBNAIL_QUALITY })
        .toBuffer(),

      // Full-size: 1200px width, JPEG quality 85
      baseImage
        .clone()
        .resize({
          width: FULL_SIZE_WIDTH,
          withoutEnlargement: true, // Don't upscale small images
        })
        .jpeg({ quality: FULL_SIZE_QUALITY })
        .toBuffer(),

      // Blur placeholder: 20px width for loading states
      baseImage
        .clone()
        .resize({
          width: BLUR_WIDTH,
          withoutEnlargement: true,
        })
        .jpeg({ quality: 60 }) // Lower quality for blur
        .toBuffer(),
    ]);

    // Step 4: Convert blur buffer to base64 data URL
    const blurDataUrl = bufferToBlurDataUrl(blurBuffer);

    // Step 5: Validate blur placeholder length (should be ~500-1500 bytes)
    if (blurDataUrl.length > 5000) {
      console.warn('[Image] Blur placeholder larger than expected:', blurDataUrl.length);
    }

    return {
      success: true,
      data: {
        thumbnailBuffer,
        fullSizeBuffer,
        blurDataUrl,
        metadata: {
          originalWidth: metadata.width!,
          originalHeight: metadata.height!,
          format: metadata.format || 'unknown',
        },
      },
    };
  } catch (error: any) {
    const errorMessage = mapSharpError(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique filename for an uploaded image
 * 
 * @param originalFilename - The original filename from the upload
 * @returns Unique filename with .jpg extension (since we always output JPEG)
 */
export function generateUniqueFilename(originalFilename?: string): string {
  // Use crypto for UUID generation (works in Node.js and Edge)
  const uuid = crypto.randomUUID();
  
  // We always output JPEG, so use .jpg extension
  return `${uuid}.jpg`;
}

/**
 * Extracts the MIME type from a buffer using Sharp
 * 
 * @param buffer - The image buffer
 * @returns MIME type string or null if unknown
 */
export async function getImageMimeType(buffer: Buffer): Promise<string | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      avif: 'image/avif',
      heif: 'image/heif',
      tiff: 'image/tiff',
    };

    return mimeTypes[metadata.format || ''] || null;
  } catch {
    return null;
  }
}

/**
 * Quick check if a buffer is likely an image (without full validation)
 * Useful for early rejection of obviously non-image files
 * 
 * @param buffer - The buffer to check
 * @returns true if buffer starts with common image magic bytes
 */
export function isLikelyImage(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // Check magic bytes for common image formats
  const header = buffer.subarray(0, 12);
  
  // JPEG: starts with FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return true;
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4E &&
    header[3] === 0x47
  ) {
    return true;
  }

  // GIF: starts with GIF87a or GIF89a
  if (
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    (header[3] === 0x38)
  ) {
    return true;
  }

  // WebP: starts with RIFF....WEBP
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return true;
  }

  return false;
}

