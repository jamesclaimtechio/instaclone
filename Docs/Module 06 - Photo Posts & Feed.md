# Feature: Photo Posts & Feed (Module 6)

**Core Problem:** Enable users to create and share photo posts with captions, and view a global chronological feed of all posts from all users, forming the core content consumption and creation experience of the Instagram clone.

**Total Chunks:** 6

**Total Estimated Duration:** 18-30 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Modules 2 (Auth), 4 (User Profiles), 5 (Image Upload & R2)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Post Creation Backend | 📊 Data | 3-4 hrs | Module 5 complete (image upload working) |
| 2 | Post Creation UI | 🎨 UI | 3-5 hrs | Chunk 1 complete (server actions ready) |
| 3 | Global Feed Data Layer | 📊 Data | 3-4 hrs | Chunk 1 complete (posts can be created) |
| 4 | Feed UI Components | 🎨 UI | 4-6 hrs | Chunk 3 complete (feed queries working) |
| 5 | Post Permalink Page | 🎨 UI | 2-3 hrs | Chunk 4 complete (feed displaying) |
| 6 | Post Deletion & Cascade | ⚙️ Logic | 3-4 hrs | Chunk 5 complete (permalink page exists) |

---

# Chunk 1: 📊 Post Creation Backend

Duration: 3-4 hours | Prerequisites: Module 5 complete (image upload functionality working, R2 storing images)

## Quick Reference

**Builds:** Server Actions for creating posts with image URLs and captions, storing post metadata in database

**Connects:** Image upload service (Module 5) → Post creation actions → Posts table → Feed queries

**Pattern:** Next.js Server Actions with Drizzle ORM inserts

**Watch For:** Race conditions with image upload, null handling for optional captions, userId authentication validation

## Context

### User Problem

Users need a reliable backend system to persist their photo posts with captions so their content is permanently stored and retrievable.

### From Module Brief

- **Post Creation:** Server Action receives image URLs from upload service, caption text, and creates database record
- **Caption Field:** Optional, unlimited length, must handle empty strings
- **Database Storage:** posts table stores userId, imageUrl, thumbnailUrl, caption, blurHash, createdAt
- **Authentication:** Only authenticated users can create posts, userId must come from session

## What's Changing

### New Additions

- **createPost Server Action:** Accepts imageUrl, thumbnailUrl, blurHash, and optional caption; validates auth; inserts into posts table; returns created post with all metadata
- **getPostById query function:** Fetches single post by ID with author information joined from users table
- **validatePostOwnership utility:** Checks if current user owns a specific post (needed for deletion later)

### Modifications to Existing

- None (this is the first post-related functionality)

### No Changes To

- Image upload functionality from Module 5
- Authentication middleware from Module 2
- User profile queries from Module 4

## Data Flow

### Post Creation Flow

1. **Trigger:** User submits create post form with image file and caption
2. **Image Upload:** Image upload service (Module 5) processes and uploads to R2, returns URLs and blurHash
3. **Validation:** Server Action validates user is authenticated, checks imageUrl is valid URL format
4. **Database Insert:** Insert new record into posts table with userId (from session), imageUrl, thumbnailUrl, caption (or empty string), blurHash, createdAt (auto-generated)
5. **Conditional Branches:**
    - If success → return created post object with full data including author info
    - If auth fails → return error "Not authenticated"
    - If database error → return error "Failed to create post"
6. **Final State:** Post exists in database, ready to appear in feed queries

## Things to Watch For

**Authentication Bypass Risk** → User could manipulate userId in request → Prevention: Always extract userId from server-side session/JWT validation, never trust client input for userId

**Null Caption Handling** → Caption field is optional but database might not accept null → Prevention: Convert undefined/null captions to empty string before database insert, ensure database schema allows empty strings

**Image URL Validation Gap** → Malicious user could submit arbitrary URLs not from your R2 bucket → Prevention: Validate imageUrl and thumbnailUrl match expected R2 domain pattern before storing

**BlurHash Missing** → If image upload fails partially, blurHash might be missing → Prevention: Make blurHash required in Server Action, fail post creation if missing since it's needed for UI loading states

**Transaction Race Condition** → Post created but follow-up query fails → Prevention: Wrap insert and initial fetch in single transaction, or return inserted data directly from insert operation

**XSS via Caption** → User inputs malicious HTML/JavaScript in caption → Prevention: Captions should be stored as plain text, rendering layer must escape HTML entities (React does this by default for text content)

**Very Long Captions** → Master Spec says no limit, but database might have implicit limits → Prevention: Set realistic varchar limit in schema (e.g., 10,000 chars) or use text type with warning about performance

**Missing createdAt** → If database doesn't auto-generate timestamp → Prevention: Ensure Drizzle schema has defaultNow() for createdAt, verify in testing that timestamps populate

**Post Creation Without Image** → Logic error could allow post with no image → Prevention: Validate imageUrl and thumbnailUrl are non-empty strings before proceeding

**Unauthorized Access to Server Action** → Unauthenticated users calling createPost → Prevention: Check session exists at start of Server Action, return early if no valid session

**Database Connection Failure** → Neon database temporarily unavailable → Prevention: Implement proper error handling, return user-friendly error message, don't expose database errors to client

**Invalid UUID for userId** → Session contains corrupted or invalid user ID → Prevention: Validate userId format before using in database queries, handle invalid UUID errors gracefully

**Duplicate Post Submissions** → User double-clicks submit button → Prevention: Implement idempotency key or debouncing in UI layer (Chunk 2), backend should handle duplicate inserts gracefully

**Missing Author Information** → getPostById returns post but user was deleted → Prevention: Use LEFT JOIN when fetching author info, handle cases where user is null (show "Deleted User")

**Performance with Large Blobs** → BlurHash stored as very large base64 string → Prevention: Validate blurHash is reasonable size (< 1KB), reject if suspiciously large

**Time Zone Issues** → createdAt timestamp might not be consistent across timezones → Prevention: Store all timestamps in UTC (Postgres default), handle timezone conversion in UI layer only

**Caption Encoding Issues** → Special characters or emoji in captions break database insert → Prevention: Ensure database connection uses UTF-8 encoding, test with emoji and special characters

**Optimistic Locking Failure** → Two simultaneous creates with same data → Prevention: Not applicable for creates, but ensure auto-increment/UUID generation handles concurrency

**Memory Leak with Large Captions** → Very long captions held in memory → Prevention: Stream large text fields if needed, but with reasonable limits this shouldn't be an issue

**Cascading Delete Setup** → Posts need proper foreign key constraints for later cascade deletes → Prevention: Verify Drizzle schema has proper foreign key to users table with CASCADE on delete

**Query Performance** → getPostById might be slow if not indexed → Prevention: Ensure posts table has primary key index on id, verify query performance in testing

**Return Data Consistency** → Returned post object structure inconsistent with what UI expects → Prevention: Define TypeScript type for Post object, ensure Server Action returns complete object with all required fields

**Session Expiration During Creation** → User's session expires between image upload and post creation → Prevention: Check session validity at start of Server Action, return authentication error if expired

**Error Message Leakage** → Database errors exposed to client revealing schema details → Prevention: Catch all database errors, return generic "Failed to create post" message, log detailed errors server-side only

**Missing Indexes on Foreign Keys** → userId foreign key not indexed causing slow queries later → Prevention: Add index on posts.userId in Drizzle schema for efficient user post queries

## Testing Verification

### Existing Features Still Work

- [ ]  Image upload from Module 5 still works independently
- [ ]  User authentication from Module 2 still validates correctly
- [ ]  User profile queries from Module 4 still return correct data

### New Functionality Works

- [ ]  createPost Server Action successfully inserts post into database
- [ ]  Created post has correct userId from authenticated session
- [ ]  Created post has all required fields: imageUrl, thumbnailUrl, blurHash, createdAt
- [ ]  Optional caption stored correctly when provided
- [ ]  Empty caption (not provided) stored as empty string
- [ ]  getPostById returns post with author information
- [ ]  createdAt timestamp is in UTC and correctly formatted

### Edge Cases

- [ ]  createPost rejects unauthenticated requests with clear error
- [ ]  createPost rejects requests with missing imageUrl
- [ ]  createPost handles very long captions (5000+ characters)
- [ ]  createPost handles captions with emoji and special characters
- [ ]  getPostById handles case where author user was deleted
- [ ]  Database errors return user-friendly messages without exposing schema

---

# Chunk 2: 🎨 Post Creation UI

Duration: 3-5 hours | Prerequisites: Chunk 1 complete (createPost Server Action working, posts storing in database)

## Quick Reference

**Builds:** User-facing form for creating posts with image upload and caption input, including loading states and success/error handling

**Connects:** User input → Image upload component (Module 5) → createPost Server Action → Success redirect to feed

**Pattern:** Next.js client component with form submission, FormData handling, loading states

**Watch For:** File size validation before upload, preventing double submission, handling upload failures gracefully

## Context

### User Problem

Users need an intuitive interface to select photos, add captions, and publish posts with clear feedback during the upload process.

### From Module Brief

- **Post Creation Form:** Image upload area and caption text input
- **Caption Field:** Optional, no max length enforced in UI
- **Loading State:** Progress indicator during upload and post creation
- **Success Flow:** Redirect to feed after successful post creation
- **Error States:** Clear error messages for upload failures, creation failures, network errors
- **Access Control:** Only verified users can access (enforced by read-only mode from Module 3)

## What's Changing

### New Additions

- **Create Post Page:** New route for post creation form
- **Image Upload Area:** File input with drag-and-drop support, preview of selected image before upload
- **Caption Input:** Textarea for optional caption text
- **Submit Button:** Triggers upload and post creation, shows loading state during processing
- **Loading Overlay:** Full-screen or modal loading indicator with progress if possible
- **Success Toast/Redirect:** Shows success message and navigates to feed
- **Error Display:** Toast or inline error messages for failures

### Modifications to Existing

- **Navigation:** Add "Create Post" link/button in main navigation

### No Changes To

- Feed UI (Chunk 4)
- Profile pages from Module 4
- Auth flows from Module 2

## Data Flow

### Post Creation User Flow

1. **Trigger:** User clicks "Create Post" in navigation
2. **Page Load:** Create post page displays with empty form
3. **Image Selection:** User clicks file input or drags image, preview displays
4. **Caption Entry:** User types optional caption in textarea
5. **Validation:** Client validates file type and size before proceeding
6. **Submit:** User clicks "Post" button
7. **Upload Phase:** Image upload component processes and uploads to R2 (Module 5 functionality)
8. **Creation Phase:** Calls createPost Server Action with returned URLs and caption
9. **Conditional Branches:**
    - If upload fails → show error "Upload failed. Try again.", remain on form with data preserved
    - If createPost fails → show error "Post creation failed. Try again.", remain on form
    - If success → show success toast "Post created!", redirect to feed
10. **Final State:** User sees their new post at top of feed

## UX Specification

### User Flow

- Trigger: Click "Create Post" in navigation
- Step 1: See empty create post form
- Step 2: Select image file (click or drag-and-drop)
- Step 3: See image preview
- Step 4: Optionally type caption
- Step 5: Click "Post" button
- Step 6: See loading indicator during upload/creation
- Step 7: See success message
- Step 8: Redirected to feed showing new post

### Empty States

- No image selected: Show placeholder with "Select an image" text and icon
- Caption empty: Placeholder text "Add a caption (optional)"

### Loading States

- During upload: Disable form inputs, show progress spinner on submit button
- Full page loading overlay optional but recommended for clarity
- Button text changes: "Post" → "Posting..." during submission

### Error States

- File too large: "File too large. Max 50MB."
- Unsupported file type: "Unsupported file type. Try JPG or PNG."
- Upload failed: "Upload failed. Please try again." with retry option
- Post creation failed: "Post creation failed. Please try again."
- Network error: "Connection error. Check your internet and try again."
- Not verified: "Please verify your email to create posts."

### Responsive Behavior

- Mobile: Single column, large tap target for file input, textarea spans full width
- Desktop: Centered form with max-width, larger image preview
- Image preview maintains aspect ratio, doesn't overflow container

## Things to Watch For

**Double Submission** → User clicks submit button twice quickly → Prevention: Disable submit button after first click until operation completes or fails

**File Size Validation Missing** → Large files uploaded without client-side check → Prevention: Check file.size before starting upload, show error if exceeds 50MB limit

**File Type Validation** → User selects non-image file → Prevention: Set accept="image/*" on file input, additionally check file.type starts with "image/"

**Image Preview Memory Leak** → Object URLs not revoked after preview → Prevention: Revoke object URL with URL.revokeObjectURL() on cleanup or before creating new preview

**Form Data Persisted on Error** → User loses caption text if upload fails → Prevention: Keep form state in component state, don't reset on error so user can retry

**Caption Textarea Overflow** → Very long caption breaks layout → Prevention: Set max-height with overflow-y scroll on textarea

**Upload Progress Ambiguity** → User doesn't know if upload is processing or stuck → Prevention: Show spinner and text like "Uploading image..." then "Creating post..." for different phases

**Success Redirect Too Fast** → User doesn't see success message before redirect → Prevention: Show success toast for 1-2 seconds before redirecting

**Navigation During Upload** → User navigates away while upload in progress → Prevention: Warn user with "Are you sure? Upload in progress" if they try to leave page

**Empty Image Submission** → Form submitted without selecting image → Prevention: Disable submit button until image is selected

**Stale Image Preview** → Selecting new image doesn't clear old preview → Prevention: Clear previous preview before showing new one

**Mobile File Input UX** → File input hard to use on mobile → Prevention: Make entire upload area tappable, style as large button

**Drag-and-Drop Not Supported** → Drag-and-drop fails on some browsers → Prevention: Always provide click-to-upload fallback, test drag-and-drop is enhancement not requirement

**MIME Type Spoofing** → User renames .txt to .jpg to bypass validation → Prevention: This is caught by Sharp processing in Module 5, client validation is UX not security

**Network Timeout Handling** → Upload times out on slow connection → Prevention: Show timeout error with retry option, consider increasing timeout for large files

**Optimistic UI Confusion** → User creates post but it doesn't appear immediately → Prevention: After successful creation, either refresh feed data or implement optimistic update in feed

**Error State Visibility** → Error messages appear but user doesn't notice → Prevention: Use toast notifications at top of screen, or prominent error text near form

**Caption Line Breaks** → User expects line breaks to render in caption → Prevention: Ensure textarea preserves line breaks, verify they render correctly in feed (use white-space: pre-wrap)

**Keyboard Submit** → User presses Enter expecting to submit → Prevention: Handle Enter key in textarea (should create new line), Ctrl+Enter or Cmd+Enter could submit form

**Focus Management** → After error, focus not returned to useful place → Prevention: Focus back on submit button or first error field after error occurs

**Loading State Flickering** → Loading state appears/disappears rapidly → Prevention: Minimum loading state duration of 300ms to prevent flicker

**Image Orientation Issues** → Uploaded images appear rotated → Prevention: Module 5 handles EXIF rotation, but verify preview shows correctly oriented image

**Safari Drag-and-Drop** → Drag-and-drop might not work on Safari → Prevention: Test on Safari, ensure click-to-upload always works

**Accessibility Missing** → Screen readers can't understand form → Prevention: Add proper labels to file input and textarea, ARIA attributes for loading states

**Back Button After Submit** → User presses back after creating post → Prevention: Either replace history entry or show confirmation if they try to go back during upload

**Clipboard Paste** → User wants to paste image from clipboard → Prevention: Consider adding paste support with addEventListener('paste'), but not required for MVP

## Testing Verification

### Existing Features Still Work

- [ ]  Navigation to other pages still works
- [ ]  Auth checking still prevents unauthenticated access

### New Functionality Works

- [ ]  "Create Post" link appears in navigation
- [ ]  Create post page loads without errors
- [ ]  File input opens file picker on click
- [ ]  Selected image shows preview
- [ ]  Caption textarea accepts text input
- [ ]  Submit button is disabled until image selected
- [ ]  Clicking submit starts upload process
- [ ]  Loading state displays during upload and creation
- [ ]  Success message appears on successful creation
- [ ]  Redirect to feed occurs after success
- [ ]  New post appears in feed after redirect

### Edge Cases

- [ ]  Selecting file over 50MB shows error before upload
- [ ]  Selecting non-image file shows error
- [ ]  Double-clicking submit doesn't create duplicate posts
- [ ]  Upload failure shows error and preserves caption text
- [ ]  Network error shows appropriate error message
- [ ]  Very long caption (5000+ chars) submits successfully
- [ ]  Caption with line breaks preserves formatting
- [ ]  Navigating away during upload shows warning
- [ ]  Mobile file input is easy to tap and use

---

# Chunk 3: 📊 Global Feed Data Layer

Duration: 3-4 hours | Prerequisites: Chunk 1 complete (posts table populated, createPost working)

## Quick Reference

**Builds:** Database queries for fetching paginated posts with author data for global feed display

**Connects:** Database posts & users tables → Feed query functions → Feed UI rendering

**Pattern:** Drizzle ORM queries with JOIN, ORDER BY, LIMIT/OFFSET for pagination

**Watch For:** N+1 query problems with author data, inefficient joins, pagination cursor drift

## Context

### User Problem

Users need to see all posts from all users in reverse chronological order with efficient loading and pagination.

### From Module Brief

- **Global Feed:** Shows ALL posts from ALL users (not filtered by following)
- **Chronological Order:** Newest posts first (ORDER BY createdAt DESC)
- **Pagination:** Load 20-30 posts per page
- **Author Information:** Each post must include author's profile pic, username
- **Counts:** Like count and comment count for each post
- **Optimistic UI:** Feed supports optimistic updates for likes/comments (handled in future chunks)

## What's Changing

### New Additions

- **getFeedPosts query function:** Fetches posts with pagination, includes author info, like counts, comment counts
- **Pagination logic:** Cursor-based or offset-based pagination implementation
- **Post aggregation:** Joins posts with users, counts likes and comments per post
- **getFeedPostsCount query:** Returns total count of posts for pagination UI

### Modifications to Existing

- None (first feed-related queries)

### No Changes To

- createPost Server Action from Chunk 1
- Image upload queries from Module 5
- User profile queries from Module 4

## Data Flow

### Feed Query Flow

1. **Trigger:** User visits feed page or scrolls to load more
2. **Query Parameters:** Receive page/cursor and limit (default 25 posts)
3. **Database Query:** SELECT posts with JOIN to users table for author info
4. **Aggregation:** LEFT JOIN and COUNT for likes and comments per post
5. **Ordering:** ORDER BY posts.createdAt DESC
6. **Pagination:** Apply LIMIT and OFFSET (or cursor WHERE clause)
7. **Conditional Branches:**
    - If posts found → return array of post objects with all data
    - If no posts → return empty array
    - If database error → throw error to be caught by Server Component
8. **Final State:** Posts array ready for UI rendering

### Pagination Strategy

**Cursor-Based (Recommended by Tech Spec):**

- First page: No cursor, fetch 25 most recent posts
- Next page: Pass cursor = lastPost.createdAt + [lastPost.id](http://lastPost.id)
- Query: WHERE (createdAt, id) < (cursorDate, cursorId) ORDER BY createdAt DESC, id DESC
- Benefits: No duplicate/skipped posts when new posts are added

**Alternative Offset-Based:**

- Use OFFSET and LIMIT
- Simpler but can skip/duplicate posts if feed changes

## Things to Watch For

**N+1 Query Problem** → Fetching posts then fetching each author separately → Prevention: Use JOIN in single query to get posts with author data in one database round-trip

**Missing Author Data** → Author user was deleted so JOIN returns null → Prevention: Use LEFT JOIN and handle null author gracefully (show "Deleted User")

**Like Count Performance** → Counting likes for each post requires subqueries → Prevention: Use LEFT JOIN with COUNT and GROUP BY to aggregate counts efficiently

**Comment Count Performance** → Separate query for comment counts is slow → Prevention: Include comment count in same query with multiple LEFT JOINs or subqueries

**Pagination Duplicate Posts** → Offset-based pagination shows same post twice → Prevention: Use cursor-based pagination with (createdAt, id) composite cursor for consistency

**Pagination Skipped Posts** → New posts inserted between page requests cause skips → Prevention: Cursor-based pagination handles this gracefully

**Large Result Set Memory** → Fetching all posts at once exhausts memory → Prevention: Always apply LIMIT, never fetch unlimited results

**Inefficient Index Usage** → Query doesn't use indexes causing full table scan → Prevention: Ensure index on posts.createdAt, verify EXPLAIN shows index usage

**Timezone Handling** → Timestamps might be in different timezones → Prevention: Store all createdAt in UTC, Postgres handles this by default

**NULL Handling in Aggregates** → COUNT might return null instead of 0 → Prevention: Use COALESCE(COUNT(*), 0) to ensure counts return 0 not null

**JOIN Performance Degradation** → Multiple JOINs slow down as tables grow → Prevention: Test with large datasets (1000+ posts), add indexes on foreign keys

**Cursor Encoding Issues** → Cursor contains special characters that break URLs → Prevention: Base64 encode cursor values for safe URL usage

**Stale Count Data** → Like/comment counts cached and stale → Prevention: Compute counts in real-time, don't cache at query level (caching is UI concern)

**Query Timeout on Large Tables** → Query times out with millions of posts → Prevention: Set appropriate query timeout, ensure indexes are working, consider query optimization

**Inconsistent Ordering** → Posts with same createdAt timestamp order randomly → Prevention: Include id as secondary sort key: ORDER BY createdAt DESC, id DESC

**SQL Injection Risk** → Cursor or limit parameters not sanitized → Prevention: Use Drizzle's parameterized queries, never concatenate strings for SQL

**Missing BlurHash** → Some posts don't have blurHash stored → Prevention: Make blurHash required at creation, but handle null gracefully in queries for older data

**Author Profile Picture Missing** → User has no profile picture → Prevention: Return null for profilePictureUrl, UI shows default avatar

**Limit Validation Missing** → Client requests 10,000 posts → Prevention: Enforce max limit of 30, min limit of 1, use default 25

**Cursor Validation Missing** → Invalid cursor format crashes query → Prevention: Validate cursor format before using in query, return error or default to first page

**Transaction Isolation Issues** → Reading posts while they're being created → Prevention: Use default READ COMMITTED isolation, shouldn't be an issue for reads

**Empty Feed Performance** → Even empty feed runs expensive queries → Prevention: Quick COUNT check first, if zero posts return empty array immediately

**Pagination Metadata Missing** → UI needs to know if more pages exist → Prevention: Fetch limit + 1 posts, if got limit + 1 then hasMore = true

**Author Username Changed** → Username in feed doesn't match profile → Prevention: Join always gets current username from users table, no caching issue

**Soft Deleted Posts** → If implementing soft delete, they still appear → Prevention: MVP has hard delete, but if adding soft delete add WHERE deleted_at IS NULL

**Performance Monitoring Gap** → Slow queries not detected → Prevention: Log query execution time, alert if consistently over 500ms

## Testing Verification

### Existing Features Still Work

- [ ]  Post creation from Chunk 1 still works
- [ ]  User authentication still validates
- [ ]  User profile queries still return correct data

### New Functionality Works

- [ ]  getFeedPosts returns array of posts
- [ ]  Each post includes author username and profile picture
- [ ]  Each post includes like count (0 if no likes)
- [ ]  Each post includes comment count (0 if no comments)
- [ ]  Posts ordered by createdAt DESC (newest first)
- [ ]  Pagination returns correct number of posts (25 or specified limit)
- [ ]  Second page returns different posts than first page
- [ ]  Empty feed returns empty array (no errors)

### Edge Cases

- [ ]  Feed with 1 post returns correctly
- [ ]  Feed with 100+ posts paginates correctly
- [ ]  Post with deleted author shows gracefully ("Deleted User")
- [ ]  Post with 0 likes shows count as 0 not null
- [ ]  Post with 0 comments shows count as 0 not null
- [ ]  Invalid cursor returns first page or clear error
- [ ]  Request for 1000 post limit is capped at 30
- [ ]  Cursor-based pagination doesn't show duplicates when new posts added

---

# Chunk 4: 🎨 Feed UI Components

Duration: 4-6 hours | Prerequisites: Chunk 3 complete (getFeedPosts query working, returning paginated post data)

## Quick Reference

**Builds:** Feed page displaying all posts as cards with images, author info, captions, counts, and infinite scroll pagination

**Connects:** Feed page component → getFeedPosts query → Post card components → Individual post data display

**Pattern:** Next.js Server Component for initial data, client components for interactive elements, infinite scroll with React hooks

**Watch For:** Image loading performance, skeleton loader layout shift, infinite scroll triggering multiple times

## Context

### User Problem

Users need an engaging, visually appealing feed that loads quickly, displays posts clearly, and seamlessly loads more content as they scroll.

### From Module Brief

- **Feed Location:** Home page at `/` or `/feed`
- **Post Display:** Author profile pic, username, image (thumbnail), caption, like count, comment count, timestamp
- **Clickable Elements:** Username links to profile, image/post area links to permalink
- **Timestamps:** Relative format ("2 hours ago") with fallback to date for old posts
- **Infinite Scroll:** Load more posts automatically when user scrolls near bottom
- **Empty State:** "No posts yet! Create the first post." with prominent CTA
- **Loading States:** Skeleton loaders for initial load, spinner for pagination
- **Blur Placeholders:** Images show blur while loading full image

## What's Changing

### New Additions

- **Feed Page:** Main feed route rendering at `/` or `/feed`
- **Post Card Component:** Reusable component displaying single post with all metadata
- **Post Author Section:** Profile picture and username display within post card
- **Post Image Display:** Image component with blur placeholder, click to permalink
- **Post Caption Display:** Caption text below image, handles line breaks
- **Post Metadata Section:** Like count, comment count, timestamp display
- **Infinite Scroll Logic:** Detects scroll position, triggers next page load
- **Skeleton Post Loader:** Placeholder for posts while loading
- **Empty Feed State:** Component showing empty state message and CTA

### Modifications to Existing

- **Navigation:** Home/Feed link in navigation should be highlighted when on feed page

### No Changes To

- Post creation UI from Chunk 2
- User profile pages from Module 4
- Like button (added in Module 7)
- Comment button (added in Module 8)

## Data Flow

### Feed Page Load Flow

1. **Trigger:** User navigates to `/` or `/feed`
2. **Server Component:** Feed page loads, calls getFeedPosts for first page
3. **Initial Render:** Server renders page with first 25 posts
4. **Client Hydration:** Client components become interactive
5. **Image Loading:** Images load progressively, blur placeholders visible until loaded
6. **Conditional Branches:**
    - If posts exist → render post cards
    - If no posts → render empty state
    - If initial load error → render error message with retry
7. **Final State:** Feed displaying with scrollable content

### Infinite Scroll Flow

1. **Trigger:** User scrolls to 80% down the page
2. **Scroll Detection:** IntersectionObserver or scroll event detects position
3. **Load More Check:** Verify hasMore is true, not already loading
4. **Query Next Page:** Call getFeedPosts with next cursor/page
5. **Append Posts:** Add new posts to existing feed list
6. **Conditional Branches:**
    - If posts returned → append to list, update hasMore
    - If empty array → set hasMore to false, no more posts
    - If error → show inline error with retry button
7. **Final State:** More posts visible, ready for more scrolling

## UX Specification

### User Flow

- Trigger: Navigate to home page or click "Feed" in navigation
- Step 1: See skeleton loaders while initial posts load
- Step 2: Posts appear with blur placeholders for images
- Step 3: Images load progressively from blur to full image
- Step 4: Scroll down to view more posts
- Step 5: Near bottom, see spinner and new posts load automatically
- Step 6: Continue scrolling through all posts
- End state: Reach end of posts, see "You're all caught up!" message

### Empty States

- No posts in feed: Large message "No posts yet! Create the first post." with "Create Post" button
- User at end of feed: "You're all caught up!" message at bottom

### Loading States

- Initial page load: 3-5 skeleton post cards with shimmer animation
- Infinite scroll loading: Spinner at bottom of feed
- Individual images: Blur placeholder until image loads
- Skeleton includes: Circle for profile pic, rectangle for username, large rectangle for image, lines for caption

### Error States

- Feed load failure: "Couldn't load feed. Please refresh the page." with refresh button
- Pagination failure: Inline error at bottom "Couldn't load more posts. Try again." with retry button
- Image load failure: Show alt text or placeholder image with icon

### Responsive Behavior

- Mobile: Single column, full width images, compact metadata
- Tablet: Single column with max-width, images centered
- Desktop: Single column centered with max-width 600-800px, images centered
- All sizes: Post cards have consistent spacing, touch targets minimum 44px

## Things to Watch For

**Infinite Scroll Triggers Multiple Times** → Scroll detection fires multiple load requests → Prevention: Set loading flag, prevent new requests until current request completes

**Layout Shift from Images** → Images loading causes content to jump → Prevention: Set explicit aspect ratio or height on image containers before image loads

**Skeleton Loader Mismatch** → Skeleton doesn't match actual post card layout → Prevention: Make skeleton match exact layout of real post card

**Blur Placeholder Not Showing** → Next.js Image component not displaying blur → Prevention: Verify blurDataURL prop is set, base64 blurHash is valid

**Relative Timestamps Stale** → "2 hours ago" never updates → Prevention: Either use client component to re-render timestamps or accept static timestamps (acceptable for MVP)

**Empty State Not Visible** → Empty state shows but user doesn't see it → Prevention: Center empty state vertically, make text prominent, add spacing

**Scroll to Top After Pagination** → Page jumps to top when new posts load → Prevention: Maintain scroll position when appending posts

**Double Click on Post Card** → User clicks twice, navigates twice → Prevention: Debounce navigation or accept double navigation (browser handles gracefully)

**Caption with Very Long Text** → Caption overflows container → Prevention: Allow caption to wrap, no truncation required per spec

**Caption Line Breaks Not Preserved** → Line breaks in caption don't render → Prevention: Use white-space: pre-wrap CSS on caption text element

**Username/Profile Pic Missing** → Author data is null → Prevention: Show "Deleted User" text and default avatar when author is null

**Like/Comment Counts as Null** → Counts show "null" instead of 0 → Prevention: Fallback to 0 in UI if count is null/undefined

**Timestamp Format Inconsistency** → Some timestamps relative, some absolute → Prevention: Use consistent formatting function, relative for < 7 days, date for older

**Image Aspect Ratio Distortion** → Images stretched or squashed → Prevention: Use object-fit: cover on images, maintain aspect ratio

**Infinite Scroll Never Triggers** → User scrolls but pagination doesn't load → Prevention: Verify IntersectionObserver setup, test scroll detection logic

**Intersection Observer Cleanup Missing** → Observer not disconnected on unmount → Prevention: Return cleanup function from useEffect to disconnect observer

**Memory Leak from Feed State** → Appending posts indefinitely grows memory → Prevention: Consider virtualization for very long feeds or accept growing array (acceptable for MVP)

**Server/Client Component Confusion** → Trying to use hooks in Server Component → Prevention: Clearly separate Server Components (data fetching) from Client Components (interactivity)

**Hydration Mismatch** → Server rendered HTML doesn't match client → Prevention: Avoid using browser-only values during initial render (timestamps handled carefully)

**CTA Button Not Working** → "Create Post" in empty state doesn't navigate → Prevention: Verify button links to create post page with proper Next.js Link

**Post Card Click Area Ambiguity** → Entire card clickable vs specific areas → Prevention: Make image and caption area clickable to permalink, username separately clickable to profile

**Spinner Visibility** → Loading spinner at bottom not visible on light background → Prevention: Style spinner with sufficient contrast, add loading text

**Post Cards Not Distinct** → Hard to see where one post ends and next begins → Prevention: Add border or shadow to post cards, spacing between cards

**Accessibility Missing** → Screen readers can't understand feed structure → Prevention: Use semantic HTML (article for post cards), ARIA labels for counts

**Keyboard Navigation** → Can't navigate feed with keyboard → Prevention: Ensure clickable elements are focusable, tab order is logical

**Caption XSS Risk** → Caption contains malicious HTML → Prevention: React escapes text by default, verify caption rendered as text not dangerouslySetInnerHTML

**Feed Page Metadata** → Page title and meta tags not set → Prevention: Set page title "Feed" and appropriate meta tags for SEO

**Image Loading Priority** → All images load at once causing slowdown → Prevention: Use Next.js Image component with priority on first few images only

**Skeleton Animation Performance** → Shimmer animation causes jank → Prevention: Use CSS animations, avoid JavaScript animations, test on low-end devices

## Testing Verification

### Existing Features Still Work

- [ ]  Navigation to other pages still works
- [ ]  Post creation still works
- [ ]  Authentication redirects still work

### New Functionality Works

- [ ]  Feed page loads at `/` and `/feed`
- [ ]  Initial page shows first 25 posts
- [ ]  Each post displays author profile pic and username
- [ ]  Each post displays thumbnail image
- [ ]  Each post displays caption with line breaks preserved
- [ ]  Each post displays like count and comment count
- [ ]  Each post displays relative timestamp ("2 hours ago")
- [ ]  Clicking username navigates to user profile
- [ ]  Clicking post image navigates to post permalink
- [ ]  Scrolling near bottom loads more posts
- [ ]  Loading spinner shows while pagination loads
- [ ]  Empty feed shows empty state message and CTA

### Edge Cases

- [ ]  Feed with 1 post displays correctly
- [ ]  Feed with 100+ posts paginates smoothly
- [ ]  Post with deleted author shows "Deleted User"
- [ ]  Post with 0 likes shows "0 likes" not null
- [ ]  Post with very long caption displays fully
- [ ]  Caption with emoji and special characters renders correctly
- [ ]  Images with different aspect ratios display without distortion
- [ ]  Slow image loading shows blur placeholder
- [ ]  Pagination error shows retry button
- [ ]  Infinite scroll stops at end of posts
- [ ]  Skeleton loaders match actual post card layout

---

# Chunk 5: 🎨 Post Permalink Page

Duration: 2-3 hours | Prerequisites: Chunk 4 complete (feed displaying, post cards rendering correctly)

## Quick Reference

**Builds:** Dedicated page for individual post view with full-size image and all post details

**Connects:** Post permalink route `/post/[id]` → getPostById query → Post detail display

**Pattern:** Next.js dynamic route Server Component with params

**Watch For:** Invalid post ID handling, deleted post edge cases, full-size image loading

## Context

### User Problem

Users need a focused view to see a single post in detail with full-size image, all comments (added in Module 8), and ability to share a direct link.

### From Module Brief

- **URL Structure:** `/post/[postId]`
- **Display:** Full-size image (1200px width), author info, caption, like count, comment count, timestamp
- **Comments Section:** Will show all comments (Module 8 adds comment functionality)
- **Comment Input:** Prominently displayed (Module 8 adds functionality)
- **Shareable URL:** Each post has unique URL for sharing
- **Back Navigation:** Back button or breadcrumb to return to feed
- **404 Handling:** Invalid post ID shows 404 page

## What's Changing

### New Additions

- **Post Permalink Route:** Dynamic route at `/post/[id]`
- **Post Detail Page Component:** Full page layout for single post
- **Full-Size Image Display:** Shows 1200px width image from R2
- **Post Metadata Section:** Author, caption, counts, timestamp in sidebar or below image
- **Comments Section Placeholder:** Area where comments will appear (Module 8)
- **Comment Input Placeholder:** Area where comment input will go (Module 8)
- **Back Navigation:** Link or button to return to feed
- **404 Page:** Custom not found page for invalid post IDs

### Modifications to Existing

- **Post Card Component:** Verify click on image navigates to permalink with correct ID

### No Changes To

- Feed UI from Chunk 4
- Post creation from Chunks 1-2
- User profiles from Module 4

## Data Flow

### Permalink Page Load Flow

1. **Trigger:** User clicks post image/card in feed or navigates to `/post/[id]` URL
2. **Route Params:** Next.js extracts postId from URL params
3. **Data Fetch:** Server Component calls getPostById with postId
4. **Conditional Branches:**
    - If post found → render post detail page with full data
    - If post null → return notFound() to show 404 page
    - If database error → throw error to show error boundary
5. **Image Loading:** Full-size image loads with blur placeholder
6. **Final State:** Post displayed in focused view, ready for user interaction

## UX Specification

### User Flow

- Trigger: Click post image in feed
- Step 1: Navigate to `/post/[id]` page
- Step 2: See blur placeholder immediately
- Step 3: Full-size image loads progressively
- Step 4: See all post details (author, caption, counts)
- Step 5: View comments section (empty for now until Module 8)
- Step 6: Click back button to return to feed

### Empty States

- No comments: "No comments yet. Be the first to comment!" (Module 8 adds comment input)

### Loading States

- Full-size image: Blur placeholder until loaded
- Page load: Can show loading spinner briefly if needed

### Error States

- Post not found: 404 page "Post not found" with link back to feed
- Image load failure: Show error message or broken image icon

### Responsive Behavior

- Mobile: Image full width, metadata below image
- Tablet: Image centered, metadata below or in sidebar
- Desktop: Image on left (or centered), metadata and comments in sidebar on right
- All sizes: Full-size image maintains aspect ratio, no distortion

## Things to Watch For

**Invalid Post ID Format** → Non-UUID string passed as postId → Prevention: Validate postId is valid UUID format before querying, return 404 if invalid

**Post Not Found** → Post ID doesn't exist in database → Prevention: Check if getPostById returns null, call notFound() to render 404 page

**Deleted Post Edge Case** → Post was deleted between click and page load → Prevention: Same as post not found, show 404 page

**Full-Size Image Too Large** → 1200px image loads slowly on mobile → Prevention: Consider responsive image sources, but Module 5 optimized images should be fine

**BlurHash Missing** → Post doesn't have blurHash stored → Prevention: Provide default blur or skip blur if not available, don't break page

**Author Deleted** → Post exists but author user deleted → Prevention: Handle null author, show "Deleted User" in author section

**Caption Overflow** → Very long caption breaks layout → Prevention: Allow caption to wrap naturally, no truncation per spec

**Timestamp Display** → Relative timestamp might look weird on permalink → Prevention: Show full date on permalink page instead of relative time, or both

**URL Sharing** → User shares URL but post is deleted by time someone clicks → Prevention: Handle gracefully with 404 page, expected behavior

**SEO Missing** → Permalink page has no meta tags → Prevention: Set dynamic page title with author and caption snippet, add Open Graph tags

**Back Navigation State** → Back button doesn't return to same feed position → Prevention: Browser handles this naturally, use standard Link component

**Comment Section Placeholder** → Empty comment section looks broken → Prevention: Add clear text "Comments will appear here" or similar until Module 8

**Image Aspect Ratio** → Full-size image doesn't maintain aspect ratio → Prevention: Use Next.js Image with width/height from metadata or layout="responsive"

**Mobile Image Scaling** → Image too large on small screens → Prevention: Set max-width: 100% on image container

**Loading State Missing** → Page appears blank while loading → Prevention: Show skeleton or loading spinner during initial load

**Error Boundary Missing** → Database errors crash entire page → Prevention: Wrap in error boundary to show error UI instead of white screen

**Likes/Comments Count Stale** → Counts shown but can't verify accuracy → Prevention: Real-time counts added in Modules 7-8, static display acceptable for now

**Page Title Not Set** → Browser tab shows generic title → Prevention: Set title to "Post by @username" or similar

**Mobile Back Button** → No obvious way to navigate back on mobile → Prevention: Add prominent back button at top of page

**Keyboard Accessibility** → Can't navigate away with keyboard → Prevention: Ensure back button is focusable and keyboard accessible

**Image Right-Click Menu** → Users can download full-size image → Prevention: Expected behavior, images are public, no need to prevent

**Hydration Issues** → Server/client mismatch with dynamic content → Prevention: Keep rendering consistent, avoid browser-only values during initial render

**Parallel Routes Confusion** → Using Next.js parallel routes when not needed → Prevention: Use simple dynamic route, parallel routes not needed for this use case

**Canonical URL Missing** → SEO might index multiple URLs → Prevention: Set canonical URL to permalink URL in meta tags

**Social Sharing Preview** → Shared links don't show preview → Prevention: Add Open Graph tags with image URL, description from caption

**Loading Spinner Placement** → Loading spinner not visible → Prevention: Center spinner on page, sufficient size and contrast

## Testing Verification

### Existing Features Still Work

- [ ]  Feed page still displays correctly
- [ ]  Navigation still works
- [ ]  Post creation still works

### New Functionality Works

- [ ]  Clicking post in feed navigates to permalink page
- [ ]  Permalink URL format is `/post/[uuid]`
- [ ]  Permalink page displays full-size image
- [ ]  Author profile pic and username displayed
- [ ]  Caption displayed with line breaks preserved
- [ ]  Like count and comment count displayed
- [ ]  Timestamp displayed
- [ ]  Back button navigates to feed
- [ ]  Comments section placeholder visible

### Edge Cases

- [ ]  Invalid post ID (non-UUID) shows 404 page
- [ ]  Non-existent post ID shows 404 page
- [ ]  Deleted post shows 404 page
- [ ]  Post with deleted author shows "Deleted User"
- [ ]  Post with very long caption displays fully
- [ ]  Full-size image loads with blur placeholder
- [ ]  Image load failure shows error gracefully
- [ ]  Page title set to include author username
- [ ]  Open Graph tags present for social sharing

---

# Chunk 6: ⚙️ Post Deletion & Cascade Logic

Duration: 3-4 hours | Prerequisites: Chunk 5 complete (permalink page displaying, post detail view working)

## Quick Reference

**Builds:** Ability for users to delete their own posts with confirmation dialog and cascade deletion of associated likes and comments

**Connects:** Delete button UI → deletePost Server Action → Database cascade delete → Redirect to feed

**Pattern:** Server Action with authorization check, database cascade constraints, confirmation dialog

**Watch For:** Authorization bypass, cascade failures, orphaned data in R2 storage

## Context

### User Problem

Users need ability to remove their own posts permanently when they no longer want the content visible.

### From Module Brief

- **Delete Own Posts:** Users can only delete posts they created
- **Confirmation Dialog:** "Delete this post? This cannot be undone."
- **Cascade Deletion:** Post deletion also deletes all associated likes and comments
- **UI Location:** Delete button on post permalink page for own posts
- **Feed Location:** Delete option could also be on post cards in feed (optional)
- **Redirect:** After deletion, redirect to feed
- **No Delete for Others:** Users cannot delete other users' posts (only admin in Module 11)

## What's Changing

### New Additions

- **deletePost Server Action:** Accepts postId, validates user owns post, deletes from database with cascades
- **Delete Button Component:** Shows on permalink page only for post owner
- **Confirmation Dialog:** Modal or browser confirm dialog before deletion
- **Delete Success Handler:** Redirects to feed after successful deletion
- **Authorization Check:** Validates current user is post author before allowing deletion

### Modifications to Existing

- **Permalink Page:** Add delete button that only shows for post owner
- **Post Card (Optional):** Could add delete option to dropdown menu on post cards in feed
- **Database Schema:** Verify cascade delete constraints exist on likes and comments tables

### No Changes To

- Feed query logic from Chunk 3
- Post creation from Chunks 1-2
- User profile pages

## Data Flow

### Post Deletion Flow

1. **Trigger:** User clicks delete button on their own post
2. **Authorization Check:** Verify current user ID matches post.userId
3. **Confirmation Dialog:** Show "Delete this post? This cannot be undone."
4. **User Confirms:** User clicks confirm button
5. **Server Action Call:** deletePost(postId) called
6. **Server-Side Auth:** Re-verify user owns post in Server Action
7. **Database Delete:** DELETE FROM posts WHERE id = postId
8. **Cascade Triggers:** Database automatically deletes associated likes and comments via foreign key constraints
9. **Conditional Branches:**
    - If success → return success status
    - If not authorized → return error "Not authorized to delete this post"
    - If post not found → return error "Post not found"
    - If database error → return error "Failed to delete post"
10. **Client Response:** On success, show success toast, redirect to feed
11. **Final State:** Post no longer exists in database or feed

### R2 Image Cleanup Flow (Optional Enhancement)

- Post deleted → Images remain in R2 but orphaned
- Acceptable for MVP: Images in R2 are cheap to store, cleanup can be batch process later
- Enhancement: Delete images from R2 during post deletion (add to Server Action)

## Things to Watch For

**Authorization Bypass** → Attacker sends deletePost request with another user's post ID → Prevention: Always verify userId from session matches post.userId before deleting

**Client-Side Auth Only** → Delete button hidden in UI but Server Action not protected → Prevention: Always re-check authorization in Server Action, never trust client

**CSRF Vulnerability** → Attacker tricks user into deleting their post → Prevention: Next.js Server Actions have CSRF protection built-in, ensure it's enabled

**Race Condition** → User deletes post while someone else is liking/commenting → Prevention: Database transaction handles this, likes/comments fail gracefully if post deleted

**Cascade Failure** → Post deleted but likes/comments remain → Prevention: Verify database foreign key constraints have ON DELETE CASCADE, test cascade works

**Orphaned R2 Images** → Post deleted but images remain in R2 → Prevention: Acceptable for MVP, or add R2 deletion to Server Action (may slow down delete operation)

**Deletion Confirmation Bypass** → User accidentally deletes without seeing confirmation → Prevention: Always show confirmation dialog, make cancel button prominent

**Post Not Found During Delete** → Post was already deleted by admin → Prevention: Handle 404 gracefully, show "Post already deleted" message

**Redirect Before Deletion Complete** → User redirected before database commit finishes → Prevention: Await Server Action completion before redirecting

**Optimistic UI Confusion** → Post disappears from UI but delete fails → Prevention: Don't use optimistic UI for deletion, wait for server confirmation

**Multiple Delete Requests** → User clicks delete button multiple times → Prevention: Disable button after first click, or make Server Action idempotent

**Delete Button Visibility** → Button shows for non-owners due to logic error → Prevention: Check [user.id](http://user.id) === post.userId on both server and client, test with different users

**Admin Delete vs User Delete** → Mixing admin deletion logic with user deletion → Prevention: Keep separate, admin deletion added in Module 11

**Transaction Rollback Issues** → Cascade deletes partially succeed then fail → Prevention: Wrap deletion in transaction if not using foreign key cascades

**Error Message Exposure** → Database errors reveal schema information → Prevention: Return generic "Failed to delete post" message, log detailed errors server-side

**Redirect Loop** → Deletion fails but redirects anyway → Prevention: Only redirect on success, show error message on failure

**Feed Cache Stale** → Post still appears in feed after deletion → Prevention: Redirect to feed with cache revalidation, or use router.refresh()

**Permalink Page 404 After Delete** → User stays on permalink page after deleting → Prevention: Redirect immediately after successful deletion

**Undo Not Available** → User can't undo accidental deletion → Prevention: No undo in MVP, confirmation dialog is protection, document this is permanent

**Soft Delete Confusion** → Implementing soft delete when spec requires hard delete → Prevention: MVP uses hard delete, posts are permanently removed

**Network Timeout** → Delete request times out on slow connection → Prevention: Set appropriate timeout, show error if timeout occurs

**Button Positioning** → Delete button not visible or hard to find → Prevention: Place prominently but not too prominently (avoid accidental clicks)

**Delete Icon Ambiguity** → Trash icon might be confused with other actions → Prevention: Use clear label "Delete" or "Delete Post" with icon

**Mobile Delete Flow** → Confirmation dialog doesn't display well on mobile → Prevention: Test on mobile, ensure dialog is responsive and accessible

**Keyboard Accessibility** → Can't delete with keyboard only → Prevention: Ensure delete button is focusable, Enter key triggers confirmation dialog

**Screen Reader Support** → Screen reader doesn't announce deletion → Prevention: Add ARIA labels, success message should be announced

## Testing Verification

### Existing Features Still Work

- [ ]  Feed still displays correctly
- [ ]  Permalink page still loads for valid posts
- [ ]  Post creation still works
- [ ]  Navigation still works

### New Functionality Works

- [ ]  Delete button appears on own posts in permalink page
- [ ]  Delete button does NOT appear on other users' posts
- [ ]  Clicking delete button shows confirmation dialog
- [ ]  Confirmation dialog has cancel and confirm options
- [ ]  Clicking cancel closes dialog, no deletion occurs
- [ ]  Clicking confirm deletes post from database
- [ ]  After deletion, redirect to feed occurs
- [ ]  Success message shows after deletion
- [ ]  Deleted post no longer appears in feed
- [ ]  Permalink for deleted post shows 404

### Edge Cases

- [ ]  User A cannot delete User B's post (button doesn't appear)
- [ ]  Attempting to delete another user's post via API returns error
- [ ]  Delete button disabled after clicking once
- [ ]  Deleting post with 10 likes removes all likes (cascade)
- [ ]  Deleting post with 5 comments removes all comments (cascade)
- [ ]  Network error during deletion shows error message
- [ ]  Deleting already-deleted post shows appropriate error
- [ ]  Multiple rapid delete clicks don't cause multiple deletions
- [ ]  Confirmation dialog is accessible with keyboard
- [ ]  Mobile confirmation dialog displays correctly

---

## Feature Acceptance Tests

**Run these after all 6 chunks are complete to verify the full Module 6 feature works:**

### Core Tests (from Module Brief)

- [ ]  User can create post with image and caption → Post created successfully
- [ ]  Navigate to feed → All posts displayed in chronological order
- [ ]  Scroll to bottom of feed → More posts load automatically
- [ ]  Click on post image → Navigate to permalink page
- [ ]  Permalink page displays full-size image and correct post details
- [ ]  Delete own post → Confirmation shown → Post deleted and removed from feed
- [ ]  Create post without caption (empty) → Post created successfully

### Edge Cases (from Module Brief)

- [ ]  Feed with zero posts → "No posts yet" message shown
- [ ]  Navigate to invalid post ID → 404 page shown
- [ ]  Caption with 5000 characters → Displays completely
- [ ]  Caption with HTML tags → Rendered as plain text (no XSS)
- [ ]  Feed load fails → Error message with refresh option
- [ ]  Image fails to load → Alt text or placeholder shown
- [ ]  Create post → immediately delete → No longer appears in feed
- [ ]  Multiple users create posts simultaneously → All appear in correct chronological order

### Integration Tests (from Module Brief)

- [ ]  User A creates post → User B sees it in feed immediately (after refresh)
- [ ]  Create post with image → image loads in feed as thumbnail → click post → image loads as full-size on permalink
- [ ]  Delete post with 10 likes and 5 comments → Post, likes, and comments all deleted from database (will verify in Modules 7-8)
- [ ]  View feed → scroll to load 50 posts → all load correctly

---

## Implementation Notes

**Database Cascade Configuration:**

Verify in Drizzle schema that posts table has proper cascade deletes:

```tsx
// Example structure (not code for you to copy):
// likes table foreign key: userId references posts(id) ON DELETE CASCADE
// comments table foreign key: postId references posts(id) ON DELETE CASCADE
```

**Pagination Strategy:**

Recommended cursor-based pagination using (createdAt, id) composite for consistency when new posts are added.

**Image Display:**

All images should use Next.js Image component with blur placeholders from blurHash stored in database.

**Timestamp Formatting:**

Use library like date-fns for consistent relative time formatting across feed and permalink pages.

**Performance Considerations:**

- Infinite scroll should debounce to prevent excessive requests
- Images should lazy load below the fold
- Initial page load should show skeleton loaders immediately
- Database queries should use indexes on createdAt and userId

**Security Checklist:**

- [ ]  All Server Actions verify authentication
- [ ]  Delete action verifies post ownership
- [ ]  Captions are rendered as text, not HTML
- [ ]  Image URLs are validated as from R2 bucket
- [ ]  Database queries use parameterized queries
- [ ]  Error messages don't expose sensitive data