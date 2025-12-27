# Feature: Image Upload & R2 Storage

**Core Problem Being Solved:** Enable reliable, optimized image uploads with automatic multi-size generation and fast global delivery via Cloudflare R2, supporting both post images and profile pictures.

**Total Chunks:** 3

**Total Estimated Duration:** 8-11 hours

**Feature Tracker Type:** New Feature

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | R2 Bucket Setup & Connection | 🔌 | 2-3 hrs | Module 1 complete (database and project structure exist) |
| 2 | Image Processing Pipeline | ⚙️ | 3-4 hrs | Chunk 1 complete (R2 connection verified and functional) |
| 3 | Upload Server Action & Integration | 🔌 | 3-4 hrs | Chunk 2 complete (image processing pipeline tested and working) |

---

# Chunk 1: 🔌 R2 Bucket Setup & Connection

Duration: 2-3 hours | Prerequisites: Module 1 complete (database and project structure exist)

## Quick Reference

**Builds:** Cloudflare R2 bucket with public read access and AWS S3 SDK client configuration for reliable file uploads

**Connects:** Environment variables → R2 client initialization → Upload capability for subsequent chunks

**Pattern:** S3-compatible object storage client pattern with credential-based authentication

**Watch For:** CORS configuration errors, credential permission scope, endpoint URL format (R2-specific vs generic S3)

## Context

### User Problem

Users cannot upload images without a reliable, cost-effective storage solution that delivers content globally with zero egress fees.

### From Module Brief

- **R2 bucket creation**: Must be configured with public read access for serving images to users
- **AWS S3 SDK integration**: R2 is S3-compatible, use standard S3 client with R2 endpoints
- **Bucket structure**: Organize files into `thumbnails/` and `full/` folders for different image sizes
- **Environment configuration**: R2 credentials and endpoint must be securely stored and accessed

## What's Changing

### New Additions

- **R2 bucket**: New Cloudflare R2 bucket created via Cloudflare dashboard with public read access enabled
- **R2 client utility**: Initialization logic for AWS S3 SDK configured for R2 endpoints, handles authentication and connection
- **Environment variables**: R2 account ID, access key ID, secret access key, bucket name, and public URL endpoint
- **Connection verification**: Utility function to test bucket connectivity and permissions before upload operations

### Modifications to Existing

- **Environment configuration**: Add R2-specific variables to environment template and validation logic

### No Changes To

- Database schema (no changes yet, URLs will be stored in Chunk 3)
- Any UI components
- Existing authentication or user features

## Data Flow

### R2 Client Initialization

1. Application starts or R2 utility is first imported
2. Environment variables are read for R2 credentials (account ID, access keys, bucket name)
3. AWS S3 client is instantiated with R2-specific endpoint URL format
4. Client configuration includes region, credentials, and endpoint
5. Connection is ready for upload operations in subsequent chunks

### Bucket Access Verification

1. Verification function is called (during setup or testing)
2. Simple HEAD or LIST operation is performed on bucket
3. R2 API responds with success or permission error
4. If success → bucket is accessible and configured correctly
5. If error → clear error message indicates misconfiguration (credentials, bucket name, or permissions)

## Things to Watch For

**R2 Endpoint URL Format → Incorrect URL breaks all uploads → Prevention**: R2 endpoints follow the pattern `https://[account-id].[r2.cloudflarestorage.com](http://r2.cloudflarestorage.com)`. Do NOT use generic S3 endpoints. Verify the endpoint format matches R2 documentation exactly, including the account ID in the subdomain.

**Public Access Configuration → Images return 403 errors when accessed → Solution**: In Cloudflare dashboard, the bucket must have "Public Access" enabled with a custom domain or [R2.dev](http://R2.dev) domain. Without this, uploaded files cannot be viewed by users even if upload succeeds. Test by uploading a file and accessing its URL in a browser.

**AWS SDK Version Compatibility → SDK v2 vs v3 have different APIs → Prevention**: Use AWS SDK v3 for better tree-shaking and modern API. The S3 client import and usage patterns differ significantly between versions. Ensure documentation and examples match the installed SDK version.

**Credential Permissions Scope → Upload fails with cryptic auth errors → Solution**: R2 API tokens need "Object Read & Write" permissions at minimum. "Admin" tokens work but are over-permissioned. Verify token scope in Cloudflare dashboard matches required operations (PutObject, GetObject at minimum).

**Missing Environment Variables → Application crashes on startup → Prevention**: Implement environment variable validation that runs before R2 client initialization. Provide clear error messages listing which variables are missing. Never let the app attempt to connect without all required credentials.

**CORS Configuration for Browser Uploads → Browser blocks direct uploads → Solution**: If implementing browser-direct uploads (bypassing server), R2 bucket needs CORS policy configured. However, for server-side uploads (recommended in architecture), CORS is not required. Clarify upload flow before configuring CORS.

**Bucket Region Specification → Auto-detection fails with R2 → Solution**: Unlike AWS S3, R2 buckets are globally distributed and don't have traditional regions. Use "auto" or "us-east-1" as placeholder region in SDK configuration. R2 ignores region but SDK requires it to be set.

**Connection Timeout Configuration → Uploads hang indefinitely on network issues → Prevention**: Configure SDK client with reasonable timeout values (e.g., 30 seconds for connection, 5 minutes for upload). Without timeouts, failed uploads can hang the server.

**Bucket Naming Constraints → Invalid bucket name prevents creation → Prevention**: R2 bucket names must be DNS-compliant: lowercase letters, numbers, hyphens only. No underscores, no uppercase, no spaces. Length between 3-63 characters. Validate name before attempting creation.

**Folder Structure Verification → Uploads to wrong paths → Solution**: R2 doesn't have true "folders" - they're key prefixes. Ensure upload logic includes the prefix in the object key (e.g., "thumbnails/image-123.jpg" not "image-123.jpg" to "thumbnails" folder). Test that uploaded files appear in expected "folders" in R2 dashboard.

**Public URL Construction → URLs are not accessible → Prevention**: R2 public URLs follow the pattern `https://[custom-domain-or-r2-dev-url]/[object-key]`. The bucket name is NOT in the URL path. Construct URLs correctly based on configured public domain, not by guessing patterns from S3 documentation.

**Credential Rotation Handling → App breaks when credentials are rotated → Solution**: Design client initialization to be lazy or reloadable, so credential updates can be applied without full app restart. Consider credential expiration scenarios if using temporary tokens.

**Error Response Format → R2 errors differ from S3 → Solution**: While mostly S3-compatible, R2 may return slightly different error codes or messages. Parse error responses defensively and provide generic fallback error messages to users.

**Multiple Client Instances → Connection pool exhaustion → Prevention**: Singleton pattern for R2 client initialization. Don't create new S3 client instances for every upload operation. Reuse a single configured client across all operations.

**Environment Variable Naming Conflicts → Wrong values loaded → Prevention**: Use clear, unique prefixes for R2 variables (e.g., R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, not AWS_ACCESS_KEY_ID which could conflict). Document variable names clearly.

**Public Domain Configuration Delay → URLs work in dashboard but not in app → Solution**: After configuring custom domain or [R2.dev](http://R2.dev) domain, DNS propagation may take time. Test URL accessibility before considering setup complete. Have fallback error messaging if images fail to load.

## Testing Verification

### Existing Features Still Work

- [ ]  Application starts successfully with R2 environment variables configured
- [ ]  Database connection still works (R2 setup doesn't affect database)
- [ ]  Authentication system unaffected by R2 configuration

### New Functionality Works

- [ ]  R2 client initializes without errors when app starts
- [ ]  Connection verification function successfully tests bucket access
- [ ]  Environment variables are validated on startup
- [ ]  Missing R2 credentials show clear error message

### Edge Cases

- [ ]  Invalid R2 credentials show clear authentication error
- [ ]  Incorrect endpoint URL shows connection error
- [ ]  Bucket name mismatch shows clear "bucket not found" error
- [ ]  Public URL format returns valid, accessible URLs

## Reference Links

- Cloudflare R2 Documentation: https://developers.cloudflare.com/r2/
- AWS SDK v3 for JavaScript: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- R2 S3 API Compatibility: https://developers.cloudflare.com/r2/api/s3/api/

---

# Chunk 2: ⚙️ Image Processing Pipeline

Duration: 3-4 hours | Prerequisites: Chunk 1 complete (R2 connection verified and functional)

## Quick Reference

**Builds:** Sharp-based image processing pipeline that generates three optimized versions (thumbnail, full-size, blur placeholder) from a single input image

**Connects:** Raw image file → Sharp processing → Three output buffers (thumbnail, full-size, blur) → Ready for R2 upload

**Pattern:** Image transformation pipeline with error handling for corrupted or invalid files

**Watch For:** Memory leaks with large images, EXIF orientation issues, format-specific processing failures, Sharp installation platform issues

## Context

### User Problem

Users upload high-resolution images that are too large for fast web delivery, and feeds need to load quickly with appropriate image sizes for different contexts.

### From Module Brief

- **Sharp image processing**: Generate thumbnail (400px width), full-size (1200px width), blur placeholder (20px width)
- **Image compression**: Quality 80 for thumbnails, quality 85 for full-size images
- **Blur placeholder generation**: Base64-encoded 20px width image for loading states
- **File type validation**: Accept all image formats (JPG, PNG, GIF, WebP, HEIC, etc.)
- **File size limit**: 50MB maximum
- **EXIF handling**: Preserve or correct image orientation

## What's Changing

### New Additions

- **Image processing utility**: Functions that take a raw image buffer and return three processed versions
- **Thumbnail generator**: Resizes to 400px width maintaining aspect ratio, compresses at quality 80, outputs JPEG
- **Full-size generator**: Resizes to 1200px width maintaining aspect ratio, compresses at quality 85, outputs JPEG
- **Blur placeholder generator**: Resizes to 20px width, converts to base64 string for inline embedding
- **File validation function**: Checks file type, file size, and image validity before processing
- **EXIF orientation handler**: Automatically rotates images based on EXIF metadata
- **Error handling wrapper**: Catches Sharp processing errors and returns user-friendly messages

### Modifications to Existing

- None (this chunk is purely additive utility functions)

### No Changes To

- R2 upload logic (happens in Chunk 3)
- Database schema
- Any UI components

## Data Flow

### Image Processing Flow

1. Raw image file buffer received (from upload in Chunk 3)
2. File validation runs: check file size ≤ 50MB, verify buffer contains valid image data
3. Sharp loads image and reads metadata (dimensions, format, EXIF orientation)
4. If EXIF orientation exists → automatically rotate image to correct orientation
5. Three parallel processing operations begin:
    - **Thumbnail path**: Resize to 400px width → compress JPEG quality 80 → output buffer
    - **Full-size path**: Resize to 1200px width → compress JPEG quality 85 → output buffer
    - **Blur path**: Resize to 20px width → compress JPEG → convert to base64 string
6. All three operations complete → return object with three processed outputs
7. If any processing fails → catch error → return specific error message (corrupted file, unsupported format, etc.)

### Error Handling Flow

1. Processing function called with image buffer
2. Try block wraps all Sharp operations
3. If Sharp throws error → catch and inspect error type
4. Error types mapped to user-friendly messages:
    - "Input buffer contains unsupported image format" → "Unsupported file type. Try JPG or PNG."
    - "Input file is missing" → "Invalid image file"
    - Sharp timeout or memory error → "Image processing failed. File may be too large or corrupted."
5. Return error object with message → upstream code can show to user

## Things to Watch For

**Memory Leaks with Large Images → Server runs out of memory → Prevention**: Sharp loads entire images into memory for processing. Multiple simultaneous 50MB uploads can exhaust server memory. Implement upload queuing or limits on concurrent processing. Monitor memory usage in production.

**EXIF Orientation Not Handled → Images appear rotated → Solution**: Many phone cameras embed EXIF orientation metadata instead of rotating pixels. Sharp must call `.rotate()` to auto-rotate based on EXIF. Without this, portrait photos may appear sideways.

**Sharp Installation Platform Issues → Native module fails to compile → Prevention**: Sharp uses native dependencies that must be compiled for the target platform. If developing on Mac but deploying to Linux (Vercel), Sharp may need platform-specific builds. Use `sharp` npm package (not sharp-cli) and ensure deployment platform matches or uses proper build flags.

**Animated GIF Processing → Only first frame processed → Solution**: By default, Sharp processes only the first frame of animated GIFs. If animated GIFs must be preserved, special handling is required (extract all frames, process each, re-animate). For MVP, document that animated GIFs will be converted to static images.

**Alpha Channel in PNGs → Converted to black background → Solution**: When converting PNG with transparency to JPEG, transparent areas become black by default. Use `.flatten({ background: '#ffffff' })` to make transparent areas white, which looks better for most photos.

**Very Small Images → Upscaling reduces quality → Solution**: If input image is smaller than target sizes (e.g., 200px input but 400px thumbnail target), Sharp will upscale and image will look blurry. Use `.resize({ width: X, withoutEnlargement: true })` to prevent upscaling smaller images.

**Base64 String Length → Very long strings in database → Prevention**: Base64-encoded blur placeholders should be tiny (20px width = ~500 bytes as base64). If string is much larger, blur image wasn't resized correctly. Validate base64 length before returning.

**Aspect Ratio Distortion → Images appear stretched → Prevention**: Always use `.resize({ width: X, height: undefined })` or `.resize({ width: X, fit: 'inside' })` to maintain aspect ratio. Never set both width and height to fixed values unless explicitly cropping.

**Color Space Conversion Issues → Colors look wrong → Solution**: Some images use non-standard color spaces (CMYK, grayscale). Sharp may need `.toColorspace('srgb')` to ensure consistent RGB output suitable for web.

**Processing Timeout on Very Large Files → No response from function → Prevention**: Set timeout limits on Sharp operations. If processing takes more than 30 seconds, consider image too large or corrupted. Kill process and return error.

**HEIC Format Support → Format not recognized → Solution**: HEIC (iPhone photos) requires additional Sharp configuration or plugins depending on Sharp version. Test HEIC uploads explicitly. If unsupported, provide clear error: "HEIC format not supported. Convert to JPG first."

**Concurrent Processing Race Conditions → Wrong images associated with wrong operations → Prevention**: Each processing operation must maintain isolation. Don't reuse Sharp instances across multiple images. Create new Sharp pipeline for each image.

**File Type Detection Bypass → Malicious files processed → Prevention**: Don't rely solely on file extension or MIME type from client. Sharp validates actual image data, but wrap in try/catch. Reject files that fail Sharp's initial image validation.

**Sharp Cache Issues → Old versions of images served → Solution**: Sharp doesn't cache processed images (that's R2's job), but Sharp may cache image metadata. Ensure each processing operation works with fresh buffer, not references to previous operations.

**Quality Settings Ignored → Images too large or too compressed → Verification**: After processing, check output buffer sizes. Thumbnail should be significantly smaller than full-size. If sizes are similar, quality settings may not be applied correctly.

**Output Format Mismatch → JPEGs saved as PNGs → Prevention**: Explicitly call `.jpeg({ quality: X })` at end of Sharp chain. Without format specification, Sharp may preserve input format, leading to inconsistent output formats.

## Testing Verification

### Existing Features Still Work

- [ ]  R2 connection still works (image processing doesn't affect R2 client)
- [ ]  Application still starts without errors

### New Functionality Works

- [ ]  Upload JPG image → three versions generated (thumbnail 400px, full-size 1200px, blur 20px)
- [ ]  Upload PNG image → three versions generated and converted to JPEG
- [ ]  Upload portrait photo with EXIF orientation → correctly rotated in all outputs
- [ ]  Blur placeholder is base64 string of reasonable length (~500-1000 bytes)
- [ ]  File size validation rejects files over 50MB
- [ ]  Invalid file (non-image) rejected with clear error

### Edge Cases

- [ ]  Upload 49MB image → processes successfully (may be slow)
- [ ]  Upload 51MB image → rejected with "File too large" error
- [ ]  Upload corrupted JPEG → rejected with "Invalid image file" error
- [ ]  Upload PNG with transparency → transparent areas become white in JPEG output
- [ ]  Upload very small image (100x100px) → not upscaled, output is 100px width
- [ ]  Upload very large image (10000x10000px) → successfully downscaled to target sizes
- [ ]  Upload animated GIF → first frame processed (document limitation)
- [ ]  Upload HEIC file → processes successfully or shows clear "format not supported" error

## Reference Links

- Sharp Documentation: https://sharp.pixelplumbing.com/
- Sharp API Reference: https://sharp.pixelplumbing.com/api-resize
- Sharp Installation Guide: https://sharp.pixelplumbing.com/install

---

# Chunk 3: 🔌 Upload Server Action & Integration

Duration: 3-4 hours | Prerequisites: Chunk 2 complete (image processing pipeline tested and working)

## Quick Reference

**Builds:** Complete end-to-end image upload flow as a Server Action that accepts image files, processes them, uploads to R2, and returns public URLs

**Connects:** Client form data → Server Action → Image processing (Chunk 2) → R2 upload (Chunk 1) → Database storage → URLs returned to client

**Pattern:** Next.js Server Action with FormData, progressive enhancement, error handling at each step

**Watch For:** FormData parsing failures, file size limits on Vercel, duplicate filename collisions, partial upload failures (some sizes succeed, others fail)

## Context

### User Problem

Users need a reliable way to upload images that handles all the complexity (validation, processing, storage) in one operation with clear success/error feedback.

### From Module Brief

- **Server Action for image upload**: Single function that orchestrates entire upload flow
- **FormData handling**: Accept file from client-side form submission
- **Unique filename generation**: Prevent collisions with UUID or timestamp-based names
- **Upload all three versions to R2**: Thumbnail to `thumbnails/` folder, full-size to `full/` folder
- **Return URLs and blur hash**: Client receives imageUrl (full-size), thumbnailUrl, blurHash for storage
- **Progress indication**: Support for progress tracking if feasible
- **Comprehensive error handling**: Clear error messages for each failure point

## What's Changing

### New Additions

- **uploadImage Server Action**: Main function that orchestrates upload flow
- **Unique filename generator**: Creates collision-resistant filenames using UUID or nanoid
- **R2 upload function**: Uses S3 SDK to PUT objects to R2 with correct paths and content types
- **Public URL constructor**: Builds accessible URLs based on R2 public domain configuration
- **FormData parser**: Extracts file buffer from FormData received from client
- **Transaction-like error handling**: If any step fails, provides rollback or clear failure state
- **Progress tracking wrapper**: Optional progress callback for large file uploads

### Modifications to Existing

- **Database queries**: Ready to receive and store URLs (actual database writes happen in Module 6 for posts, Module 4 for profiles)

### No Changes To

- UI components for upload (created in Module 4 and Module 6)
- Database schema (already defined in Module 1)
- User authentication (already in Module 2)

## Data Flow

### Complete Upload Flow

1. Client-side form submits FormData containing image file to Server Action
2. Server Action receives FormData → extracts file from form field
3. File validation: check file exists, size ≤ 50MB, buffer is valid
4. Generate unique filename: UUID + original extension → e.g., "a3f2d8c9-b4e1.jpg"
5. Pass file buffer to image processing pipeline (Chunk 2)
6. Receive three processed versions: thumbnailBuffer, fullSizeBuffer, blurBase64
7. Upload thumbnail to R2:
    - Key: `thumbnails/[unique-filename].jpg`
    - Content-Type: `image/jpeg`
    - Call S3 PutObject via R2 client (Chunk 1)
8. Upload full-size to R2:
    - Key: `full/[unique-filename].jpg`
    - Content-Type: `image/jpeg`
    - Call S3 PutObject
9. Construct public URLs:
    - thumbnailUrl: `https://[public-domain]/thumbnails/[unique-filename].jpg`
    - imageUrl: `https://[public-domain]/full/[unique-filename].jpg`
10. Return success object: `{ success: true, imageUrl, thumbnailUrl, blurHash }`
11. Client receives URLs → stores in database (handled in Module 6 for posts)

### Error Handling Flow

1. Each step wrapped in try/catch or error checking
2. **Step 2 fails** (no file in FormData) → return `{ success: false, error: "No file provided" }`
3. **Step 3 fails** (file too large) → return `{ success: false, error: "File too large. Max 50MB." }`
4. **Step 5 fails** (processing error) → return `{ success: false, error: "Image processing failed. [specific error]" }`
5. **Step 7 fails** (thumbnail upload fails) → retry once, if still fails → return `{ success: false, error: "Upload failed. Try again." }`
6. **Step 8 fails but Step 7 succeeded** (partial failure) → attempt to delete uploaded thumbnail → return error
7. **Step 9 constructs invalid URL** → return `{ success: false, error: "Configuration error" }` (this indicates env var issue)
8. Any unexpected error → log to console → return `{ success: false, error: "Something went wrong. Try again." }`

### Rollback on Partial Failure

1. Thumbnail uploads successfully to R2
2. Full-size upload fails (network error, R2 timeout, etc.)
3. Attempt cleanup: delete thumbnail from R2 using DeleteObject
4. If cleanup succeeds → return error with no orphaned files
5. If cleanup fails → log error (orphaned file in R2, but operation still failed for user)
6. Return error to client → user can retry entire upload

## Things to Watch For

**FormData File Size Limits on Vercel → Uploads fail silently → Prevention**: Vercel has 4.5MB body size limit on serverless functions by default. For 50MB uploads, must use Edge Runtime or configure payload size limits. Test with large files (45MB+) to ensure limit is properly configured.

**Unique Filename Collisions → Files overwrite each other → Prevention**: UUID v4 or nanoid practically eliminates collisions. Don't use timestamp-only naming (millisecond collisions possible with concurrent uploads). Include user ID in filename if additional uniqueness needed.

**Partial Upload Failures → Orphaned Files in R2 → Solution**: If thumbnail uploads but full-size fails, attempt to delete thumbnail. Implement cleanup function that calls DeleteObject. Log cleanup failures for manual intervention. Consider implementing periodic orphan file cleanup job.

**R2 Upload Timeout → Function hangs → Prevention**: Configure S3 SDK client with reasonable timeout (5 minutes max). Vercel serverless functions have 10-second timeout on hobby plan. For large uploads, may need Vercel Pro or Edge Runtime with streaming.

**Content-Type Not Set → Images don't display in browser → Solution**: Explicitly set Content-Type header to "image/jpeg" in PutObject call. Without this, browser may download images instead of displaying them inline.

**Public URL Construction with Missing Env Var → URLs return undefined → Prevention**: Validate R2_PUBLIC_URL environment variable before constructing URLs. If missing, fail fast with clear error message rather than returning invalid URLs.

**Concurrent Uploads from Same User → Race conditions in database → Prevention**: Upload Server Action should be idempotent and not directly write to database. Return URLs only; let calling code (Module 6 post creation) handle database writes with proper transactions.

**File Extension Extraction Errors → Wrong file extensions → Solution**: Parse original filename carefully. Handle edge cases: no extension, multiple dots, unusual extensions. Default to ".jpg" if extension cannot be determined (since output is JPEG anyway).

**S3 SDK Error Responses → Cryptic errors shown to users → Solution**: Wrap S3 SDK calls in try/catch. Parse error codes (NoSuchBucket, AccessDenied, etc.) and map to friendly messages. Never expose raw AWS error messages to users.

**Memory Leaks from Buffer Handling → Server memory grows → Prevention**: Ensure buffers are released after upload. Don't store large buffers in closures or module-level variables. Let garbage collection reclaim memory after Server Action completes.

**FormData Parsing with Empty Files → Empty buffer processed → Prevention**: After extracting file from FormData, check file.size > 0 before proceeding. Empty files should be rejected with "No file provided" error.

**Multiple Files in FormData → Wrong file processed → Solution**: If form allows multiple files, ensure correct field name is used to extract the intended file. Document expected FormData structure clearly.

**Duplicate Simultaneous Uploads → Same Image Uploaded Twice → Expected Behavior**: Each upload should generate unique filename and succeed independently. This is not an error condition. If deduplication is desired (out of scope), would require hashing file content and checking for existing hashes.

**R2 Bucket Full → Upload fails with quota error → Solution**: R2 free tier has 10GB limit. Monitor storage usage. Handle quota errors gracefully: "Storage limit reached. Contact support." In production, implement storage monitoring and alerts.

**Malformed Base64 Blur Hash → Database insert fails → Prevention**: Validate base64 string format before returning. Check length is reasonable (not empty, not megabytes). Test that base64 can be decoded without errors.

**Server Action Called Without Authentication → Unauthenticated uploads → Prevention**: Wrap Server Action logic with authentication check. Verify JWT or session before processing upload. Return 401 error if not authenticated.

**HTTPS Required for Production URLs → Images fail to load on HTTPS site → Solution**: Ensure R2 public domain uses HTTPS. HTTP URLs will be blocked by browsers on HTTPS sites. [R2.dev](http://R2.dev) domains are HTTPS by default, but custom domains must have SSL configured.

## Testing Verification

### Existing Features Still Work

- [ ]  Image processing pipeline (Chunk 2) works independently
- [ ]  R2 connection (Chunk 1) works independently
- [ ]  Application authentication still functions

### New Functionality Works

- [ ]  Upload Server Action accepts FormData with image file
- [ ]  File validation rejects files over 50MB
- [ ]  Unique filenames generated for each upload (no collisions in 10 tests)
- [ ]  Thumbnail uploaded to R2 at `thumbnails/[filename].jpg`
- [ ]  Full-size uploaded to R2 at `full/[filename].jpg`
- [ ]  Returned thumbnailUrl is publicly accessible in browser
- [ ]  Returned imageUrl is publicly accessible in browser
- [ ]  Returned blurHash is valid base64 string
- [ ]  Success response includes all three values

### Edge Cases

- [ ]  Upload without file in FormData → Error: "No file provided"
- [ ]  Upload 51MB file → Error: "File too large"
- [ ]  Upload invalid image → Error: "Invalid image file"
- [ ]  Simulate R2 upload failure → Error: "Upload failed. Try again."
- [ ]  Upload with missing R2_PUBLIC_URL env var → Clear configuration error
- [ ]  Call Server Action without authentication → 401 error
- [ ]  Two simultaneous uploads from different users → Both succeed with unique filenames
- [ ]  Upload same image twice → Both succeed as separate files (expected)
- [ ]  Thumbnail uploads but full-size fails → Thumbnail is deleted (cleanup works)

## Reference Links

- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- FormData API: https://developer.mozilla.org/en-US/docs/Web/API/FormData
- AWS SDK S3 PutObject: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/PutObjectCommand/

---

## Feature Acceptance Tests

**Run these after all chunks complete to verify the full feature works:**

### From Module Brief QA Criteria

- [ ]  Upload valid JPG image → 3 versions created and uploaded to R2
- [ ]  Upload valid PNG image → 3 versions created and uploaded to R2
- [ ]  Check R2 bucket → Files exist in correct folders (thumbnails/, full/)
- [ ]  Access R2 URL in browser → Image displays correctly
- [ ]  Upload 49MB file → Success
- [ ]  Upload 51MB file → Rejected with error
- [ ]  Upload non-image file → Rejected with error
- [ ]  Upload image with EXIF rotation data → Correctly oriented
- [ ]  Upload very small image (50x50px) → Processed without error
- [ ]  Upload very large dimensions (10000x10000px) → Resized correctly
- [ ]  Network interruption during upload → Clear error shown
- [ ]  Corrupted image file → Error: "Invalid image file"
- [ ]  Upload with slow connection → Progress indicator updates (if implemented)
- [ ]  Upload image → receive URLs → store in database → retrieve URLs → images load correctly
- [ ]  Upload image → delete from R2 manually → app handles missing image gracefully
- [ ]  Upload same image twice → Both uploads succeed with unique filenames

### Integration Tests

- [ ]  Complete flow: select image → upload → receive URLs → URLs are valid and accessible
- [ ]  Profile picture upload (Module 4) uses this upload system successfully
- [ ]  Post image upload (Module 6) uses this upload system successfully
- [ ]  Multiple concurrent uploads from different users → All succeed without conflicts
- [ ]  Upload, then immediately view uploaded image in feed → Image loads with blur placeholder → full image displays