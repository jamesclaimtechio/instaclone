import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validates that all required R2 environment variables are present
 * Returns an object with the values or throws an error
 */
function validateR2Environment() {
  const requiredVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ] as const;

  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required R2 environment variables: ${missing.join(', ')}\n` +
        'Please add these to your .env.local file.'
    );
  }

  return {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
    publicUrl: process.env.R2_PUBLIC_URL!,
  };
}

// ============================================================================
// R2 CLIENT SINGLETON
// ============================================================================

let r2ClientInstance: S3Client | null = null;
let r2Config: ReturnType<typeof validateR2Environment> | null = null;

/**
 * Gets the R2 configuration, lazily validating environment variables
 */
function getR2Config() {
  if (!r2Config) {
    r2Config = validateR2Environment();
  }
  return r2Config;
}

/**
 * Gets the singleton S3 client configured for Cloudflare R2
 * Uses lazy initialization to avoid errors during build time
 */
export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    const config = getR2Config();
    
    r2ClientInstance = new S3Client({
      // R2 endpoint format: https://[account-id].r2.cloudflarestorage.com
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      
      // R2 ignores region but SDK requires it
      region: 'auto',
      
      // Credentials
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  
  return r2ClientInstance;
}

/**
 * Gets the R2 bucket name from environment
 */
export function getR2BucketName(): string {
  return getR2Config().bucketName;
}

/**
 * Gets the public URL base for constructing accessible URLs
 */
export function getR2PublicUrl(): string {
  return getR2Config().publicUrl;
}

// ============================================================================
// URL CONSTRUCTION
// ============================================================================

/**
 * Constructs a public URL for an object in R2
 * 
 * @param objectKey - The key/path of the object in R2 (e.g., "thumbnails/abc123.jpg")
 * @returns Full public URL to access the object
 */
export function constructPublicUrl(objectKey: string): string {
  const publicUrl = getR2PublicUrl();
  
  // Ensure no double slashes between base URL and object key
  const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
  const key = objectKey.startsWith('/') ? objectKey.slice(1) : objectKey;
  
  return `${baseUrl}/${key}`;
}

// ============================================================================
// R2 OPERATIONS
// ============================================================================

/**
 * Uploads a file to R2
 * 
 * @param objectKey - The key/path where the file will be stored
 * @param body - The file content (Buffer or ReadableStream)
 * @param contentType - MIME type of the file (e.g., "image/jpeg")
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
  objectKey: string,
  body: Buffer | ReadableStream,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucketName = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
  } as PutObjectCommandInput);

  await client.send(command);

  return constructPublicUrl(objectKey);
}

/**
 * Deletes a file from R2
 * 
 * @param objectKey - The key/path of the file to delete
 * @returns true if deletion succeeded, false otherwise
 */
export async function deleteFromR2(objectKey: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucketName = getR2BucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    } as DeleteObjectCommandInput);

    await client.send(command);
    return true;
  } catch (error) {
    console.error('[R2] Delete failed:', error);
    return false;
  }
}

/**
 * Extracts the object key from a public R2 URL
 * Useful for deleting files when you only have the public URL
 * 
 * @param publicUrl - The full public URL of the object
 * @returns The object key, or null if URL doesn't match expected format
 */
export function extractObjectKeyFromUrl(publicUrl: string): string | null {
  try {
    const baseUrl = getR2PublicUrl();
    
    if (!publicUrl.startsWith(baseUrl)) {
      return null;
    }
    
    // Remove base URL and leading slash
    let key = publicUrl.slice(baseUrl.length);
    if (key.startsWith('/')) {
      key = key.slice(1);
    }
    
    return key || null;
  } catch {
    return null;
  }
}

// ============================================================================
// CONNECTION VERIFICATION
// ============================================================================

/**
 * Verifies that the R2 bucket is accessible with the current credentials
 * 
 * @returns Object with success status and optional error message
 */
export async function verifyR2Connection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getR2Client();
    const bucketName = getR2BucketName();

    // HeadBucket checks if bucket exists and is accessible
    const command = new HeadBucketCommand({
      Bucket: bucketName,
    });

    await client.send(command);

    return { success: true };
  } catch (error: any) {
    let errorMessage = 'Unknown error connecting to R2';

    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      errorMessage = `Bucket "${getR2BucketName()}" not found. Check R2_BUCKET_NAME.`;
    } else if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      errorMessage = 'Access denied. Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Cannot reach R2 endpoint. Check R2_ACCOUNT_ID.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('[R2] Connection verification failed:', error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// FOLDER PATHS
// ============================================================================

/**
 * Standard folder paths for organizing files in R2
 */
export const R2_FOLDERS = {
  // Post images
  THUMBNAILS: 'thumbnails',
  FULL_SIZE: 'full',
  
  // Profile pictures
  PROFILE_PICTURES: 'profile-pictures',
} as const;

/**
 * Constructs an object key with the appropriate folder prefix
 * 
 * @param folder - The folder constant (e.g., R2_FOLDERS.THUMBNAILS)
 * @param filename - The filename including extension
 * @returns Full object key (e.g., "thumbnails/abc123.jpg")
 */
export function constructObjectKey(
  folder: (typeof R2_FOLDERS)[keyof typeof R2_FOLDERS],
  filename: string
): string {
  return `${folder}/${filename}`;
}

