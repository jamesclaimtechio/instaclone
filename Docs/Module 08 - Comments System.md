# Feature: Comments System (Module 8)

**Core Problem:** Enable threaded conversation on posts through comments with moderation capabilities for post owners, using optimistic UI for instant feedback.

**Total Chunks:** 4

**Total Estimated Duration:** 12-18 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Module 6 (Photo Posts & Feed)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Comments Data Layer | 📊 Data | 3-4 hrs | Module 6 complete (posts displaying in feed) |
| 2 | Comment Input UI with Optimistic Updates | 🎨 UI | 4-5 hrs | Chunk 1 complete (comment Server Actions working) |
| 3 | Comment Display & Threading | 🎨 UI | 3-4 hrs | Chunk 2 complete (comments can be created) |
| 4 | Comment Moderation & Deletion | ⚙️ Logic | 2-3 hrs | Chunk 3 complete (comments displaying) |

---

# Chunk 1: 📊 Comments Data Layer

Duration: 3-4 hours | Prerequisites: Module 6 complete (posts table populated, feed displaying posts)

## Quick Reference

**Builds:** Database operations for creating, reading, and deleting comments with proper authorization

**Connects:** Comments table → Server Actions for CRUD operations → Feed/Permalink queries with comment counts

**Pattern:** Drizzle ORM operations with foreign key constraints, JOIN queries for author data

**Watch For:** Empty comment validation, XSS prevention, authorization gaps, cascade delete setup

## Context

### User Problem

Users need a reliable backend system to post, view, and manage comments on posts with proper ownership and moderation controls.

### From Module Brief

- **Comment Creation:** Users can post text comments on any post
- **Flat Threading:** No nested replies, all comments at same level (per Master Spec)
- **Comment Text:** Required, minimum 1 character, no maximum length enforced
- **Comment Count:** Each post shows total number of comments
- **Comment Order:** Chronological, newest first (per Module Brief)
- **Moderation:** Users can delete own comments, post authors can delete any comment on their posts
- **Cascade Delete:** When post deleted, all comments deleted (from Module 6)

## What's Changing

### New Additions

- **createComment Server Action:** Accepts postId and text, creates comment record for current user
- **deleteComment Server Action:** Accepts commentId, validates ownership or post ownership, deletes comment
- **getPostComments query function:** Fetches all comments for a post with author info, ordered newest first
- **getCommentCount query function:** Returns total comment count for a post
- **validateCommentOwnership utility:** Checks if user can delete comment (own comment or post owner)

### Modifications to Existing

- **getFeedPosts query (Module 6):** Must now include comment count for each post
- **getPostById query (Module 6):** Must include comment count

### No Changes To

- Post creation from Module 6
- Like functionality from Module 7
- User authentication from Module 2

## Data Flow

### Comment Creation Flow

1. **Trigger:** User types comment and clicks "Post" button
2. **Authentication Check:** Verify user is authenticated and session valid
3. **Validation:** Check text is not empty (min 1 character), postId is valid UUID, post exists
4. **Server Action Call:** createComment(postId, text) called
5. **Database Insert:** INSERT INTO comments (postId, userId, text, createdAt) VALUES (...)
6. **Fetch Created Comment:** SELECT comment with author info (username, profilePictureUrl)
7. **Update Count:** SELECT COUNT(*) FROM comments WHERE postId = $1
8. **Conditional Branches:**
    - If success → return { success: true, comment: {...}, commentCount: X }
    - If empty text → return error "Comment cannot be empty"
    - If post not found → return error "Post not found"
    - If not authenticated → return error "Not authenticated"
    - If database error → return error "Failed to post comment"
9. **Final State:** Comment exists, count incremented, ready for display

### Comment Deletion Flow

1. **Trigger:** User clicks delete button on comment
2. **Authentication Check:** Verify user is authenticated
3. **Authorization Check:** Verify user owns comment OR user owns the post
4. **Server Action Call:** deleteComment(commentId) called
5. **Fetch Comment & Post:** Get comment to check userId, get post to check post authorId
6. **Validation:** currentUserId === comment.userId OR currentUserId === post.userId
7. **Database Delete:** DELETE FROM comments WHERE id = $1
8. **Update Count:** SELECT COUNT(*) FROM comments WHERE postId = [post.id](http://post.id)
9. **Conditional Branches:**
    - If authorized and success → return { success: true, commentCount: X }
    - If not authorized → return error "Not authorized to delete this comment"
    - If comment not found → return error "Comment not found"
    - If database error → return error "Failed to delete comment"
10. **Final State:** Comment removed, count decremented

### Get Comments Flow

1. **Trigger:** User views post permalink or expands comments section
2. **Query:** SELECT comments with LEFT JOIN users for author data
3. **Ordering:** ORDER BY createdAt DESC (newest first per Module Brief)
4. **Result:** Array of comment objects with text, author, timestamp
5. **Final State:** Comments ready for display

## Things to Watch For

**Empty Comment Validation** → User submits empty string or only whitespace → Prevention: Trim text, check length > 0, return error before database insert

**XSS via Comment Text** → User inputs malicious HTML/JavaScript in comment → Prevention: Store as plain text, React escapes by default in rendering, never use dangerouslySetInnerHTML

**Authorization Bypass on Delete** → User tries to delete another user's comment → Prevention: Always verify ownership (comment.userId === currentUser OR post.userId === currentUser) in Server Action

**Very Long Comments** → Master Spec says no limit, but performance impact → Prevention: Set reasonable limit (e.g., 10,000 chars) or use TEXT type in database, warn about UI performance

**SQL Injection in Text** → Malicious comment text breaks queries → Prevention: Use parameterized queries with Drizzle, never concatenate strings

**Post Not Found** → User comments on deleted post → Prevention: Check post exists before inserting comment, foreign key constraint prevents orphaned comments

**Foreign Key Violation** → Comment references non-existent post or user → Prevention: Ensure foreign key constraints in schema on postId and userId

**Missing Cascade Delete** → Post deleted but comments remain → Prevention: Verify foreign key postId references posts(id) ON DELETE CASCADE

**Comment Count Performance** → Counting comments on every operation is slow → Prevention: Use indexed COUNT query, test with posts with 1000+ comments

**N+1 Query Problem** → Fetching author for each comment separately → Prevention: Use JOIN to get all comment authors in single query

**Deleted Author Edge Case** → Comment author user was deleted → Prevention: Use LEFT JOIN, handle null author with "Deleted User" display

**Invalid UUID Format** → postId or commentId malformed → Prevention: Validate UUID format before database operations, return clear error

**Session Expiration Mid-Comment** → User's session expires while typing → Prevention: Check session validity in Server Action, return authentication error

**Duplicate Comment Submission** → User double-clicks post button → Prevention: Debounce submit in UI (Chunk 2), backend handles duplicates gracefully

**Emoji and Special Characters** → Comments with emoji break storage → Prevention: Ensure database connection uses UTF-8 encoding, test with emoji

**Line Breaks in Comments** → Line breaks not preserved → Prevention: Store line breaks as n, render with white-space: pre-wrap CSS

**Count Inconsistency** → Comment count doesn't match actual comments → Prevention: Always query database for counts, don't rely on increment/decrement math

**Transaction Race Condition** → Comment created but count query reads stale data → Prevention: Query count in same transaction or immediately after insert

**Comment Spam** → User posts 100 comments rapidly → Prevention: No rate limiting in MVP, but backend handles load, consider UI debouncing

**Deleted Post While Commenting** → User comments as admin deletes post → Prevention: Foreign key constraint prevents insert, return "Post not found" error

**Authorization Check Missing** → Forgetting to check if user can delete comment → Prevention: Always verify ownership before delete, write tests for authorization

**Self-Moderation** → User tries to moderate comments on other users' posts → Prevention: Check post.userId === currentUserId for moderation rights

**Error Message Leakage** → Database errors expose schema details → Prevention: Catch all database errors, return generic messages, log details server-side

**Index Missing on Foreign Keys** → Queries slow due to unindexed postId → Prevention: Ensure indexes on comments.postId and comments.userId

**Timezone Issues** → Comments timestamped inconsistently → Prevention: Store all timestamps in UTC (Postgres default)

**NULL Text Field** → Database allows NULL but app expects string → Prevention: Set text field as NOT NULL in schema, validate on insert

**Comment Text Encoding** → Special characters corrupted in storage/retrieval → Prevention: Use UTF-8 throughout stack, test with international characters

**Cascade to Likes** → Deleting comment shouldn't affect likes → Prevention: Comments and likes are independent, no cascade between them

**Count as NULL** → COUNT returns null instead of 0 → Prevention: Use COALESCE(COUNT(*), 0) or handle null in application layer

**Audit Trail Missing** → No record of deleted comments → Prevention: createdAt on comments provides basic audit, hard delete acceptable for MVP

**Memory Leak with Large Result Sets** → Fetching 10,000 comments at once → Prevention: Implement pagination if post has many comments (optional for MVP)

**Comment Order Wrong** → Comments appear oldest first instead of newest → Prevention: Explicitly ORDER BY createdAt DESC in query

**Delete Returns Wrong Count** → After delete, count doesn't update → Prevention: Query count after delete, return in response

## Testing Verification

### Existing Features Still Work

- [ ]  Feed displays posts correctly
- [ ]  Post creation still works
- [ ]  Post permalink still loads
- [ ]  Like functionality still works

### New Functionality Works

- [ ]  createComment Server Action successfully inserts comment
- [ ]  Created comment has correct postId, userId, text, createdAt
- [ ]  getPostComments returns comments with author info
- [ ]  Comments ordered newest first
- [ ]  Comment count increases when comment added
- [ ]  deleteComment removes comment from database
- [ ]  Comment count decreases when comment deleted
- [ ]  User can delete own comments
- [ ]  Post author can delete any comment on their post
- [ ]  getFeedPosts includes comment count for each post

### Edge Cases

- [ ]  Empty comment text returns validation error
- [ ]  Comment with only whitespace returns error
- [ ]  Very long comment (5000+ chars) stores and retrieves correctly
- [ ]  Comment with emoji and special characters works
- [ ]  Comment with line breaks preserves formatting
- [ ]  Commenting on deleted post returns error
- [ ]  Unauthenticated comment request returns error
- [ ]  User A cannot delete User B's comment (unless post owner)
- [ ]  Deleting comment not owned returns error
- [ ]  Deleting post cascades to delete all comments
- [ ]  Post with 100 comments shows correct count
- [ ]  Comment from deleted user shows "Deleted User"

---

# Chunk 2: 🎨 Comment Input UI with Optimistic Updates

Duration: 4-5 hours | Prerequisites: Chunk 1 complete (createComment Server Action working, comments storing in database)

## Quick Reference

**Builds:** Comment input form with optimistic UI using React's useOptimistic for instant comment display

**Connects:** Comment input component → createComment Server Action → Optimistic state management → Comment list update

**Pattern:** React Client Component with useOptimistic, textarea with character validation, form submission

**Watch For:** Empty submission prevention, textarea focus management, optimistic rollback on error, scroll position

## Context

### User Problem

Users expect to see their comments appear immediately after posting without waiting for server confirmation, with smooth feedback and error recovery.

### From Module Brief

- **Input Location:** Prominent comment input on permalink page, accessible from feed
- **Input Field:** Textarea for multi-line comments
- **Validation:** Minimum 1 character, show error if empty
- **Submit Button:** "Post" button to submit comment
- **Optimistic UI:** Comment appears immediately in list before server confirmation
- **Error Handling:** Rollback optimistic update if server fails, show toast notification
- **Empty State:** Show placeholder text "Add a comment..."
- **Focus:** Auto-focus input on permalink page load (optional enhancement)

## What's Changing

### New Additions

- **CommentInput Component:** Client component with textarea and submit button
- **Optimistic Comment State:** Uses useOptimistic to show comment immediately
- **Comment Submit Handler:** Async function that adds optimistic comment, calls Server Action
- **Form Validation:** Client-side check for empty text before submission
- **Character Counter:** Optional display showing character count (if implementing limit)
- **Toast Notification:** For error messages when comment creation fails
- **Loading State:** Disable input during submission

### Modifications to Existing

- **Permalink Page (Module 6):** Add CommentInput component prominently below post
- **Feed Post Card (Module 6):** Add comment icon/button that links to permalink (already exists, verify it works)

### No Changes To

- Server Actions from Chunk 1 (backend logic remains same)
- Comment display (Chunk 3)
- Like button from Module 7

## Data Flow

### Optimistic Comment Creation Flow

1. **Trigger:** User types comment text and clicks "Post" button
2. **Validation:** Check text is not empty (trimmed length > 0)
3. **Optimistic Update:** useOptimistic immediately adds comment to list with temporary ID
4. **UI Update:** New comment appears at top of list (newest first)
5. **Input Clear:** Clear textarea, show empty placeholder
6. **Server Action Call:** Call createComment(postId, text) in background
7. **Server Response:** Wait for Server Action to complete
8. **Conditional Branches:**
    - If success → Replace optimistic comment with real comment from server (has real ID)
    - If error → Remove optimistic comment, show toast "Couldn't post comment. Try again.", restore text in textarea
9. **Final State:** Comment persisted on server or rolled back with error

## UX Specification

### User Flow

- Trigger: Type text in comment input on permalink page
- Step 1: User types multi-line comment
- Step 2: User clicks "Post" button
- Step 3: Comment immediately appears at top of comment list
- Step 4: Input clears and returns to placeholder state
- Step 5a (success): Comment stays in list with server ID
- Step 5b (failure): Comment removed from list, error toast appears, text restored to input

### Empty States

- No text entered: Placeholder "Add a comment..."
- Input disabled: Placeholder "Loading..." or grayed out

### Loading States

- During submission: Input disabled, submit button shows "Posting..." or spinner
- Optimistic comment may show subtle indicator (optional): slight opacity or pulse

### Error States

- Empty submission: Inline error "Comment cannot be empty" below textarea
- Server failure: Toast notification "Couldn't post comment. Try again."
- Network timeout: Same toast notification
- Authentication error: Toast "Please log in to comment"

### Responsive Behavior

- Mobile: Textarea full width, minimum 3 rows visible, expands as user types
- Desktop: Textarea comfortable width, minimum 2-3 rows
- All sizes: Submit button always visible, clear affordance

## Things to Watch For

**Empty Comment Submission** → User clicks post with no text → Prevention: Disable submit button when textarea empty, validate on submit

**Whitespace-Only Comment** → User submits only spaces/newlines → Prevention: Trim text before validation, check trimmed length > 0

**Double Submit** → User clicks post button twice rapidly → Prevention: Disable button during submission using isPending from useTransition

**Optimistic Rollback Glitch** → Comment flickers when removed → Prevention: Use smooth CSS transitions for comment removal

**Text Not Restored on Error** → User loses comment on failure → Prevention: Store text in state, restore to textarea on error

**Textarea Not Clearing** → After success, old text remains → Prevention: Explicitly clear textarea value after optimistic update

**Focus Not Managed** → After post, focus not returned to input → Prevention: Focus textarea after successful post for easy follow-up comments

**Scroll Position Lost** → Page jumps when comment added → Prevention: Maintain scroll position or smoothly scroll to new comment

**Optimistic Comment ID Collision** → Temporary ID conflicts with real ID → Prevention: Use negative IDs or UUIDs prefixed with "temp-" for optimistic comments

**Line Breaks Not Working** → Enter key submits instead of new line → Prevention: Textarea should accept Enter for new lines, only button click submits

**Character Limit Visual** → No indication of how long comment can be → Prevention: If implementing limit, show character counter, otherwise no limit per spec

**Textarea Height Fixed** → Long comments cut off or require scrolling → Prevention: Use auto-growing textarea or reasonable max-height with scroll

**Submit Button Position** → Button not visible when typing long comment → Prevention: Keep button visible, either fixed position or near textarea

**Keyboard Submit Missing** → Power users want Cmd+Enter to submit → Prevention: Add keyboard listener for Cmd+Enter or Ctrl+Enter (optional enhancement)

**Optimistic Comment Order Wrong** → New comment appears at bottom instead of top → Prevention: Prepend to array (newest first), verify order matches server

**Multiple Posts Share State** → Commenting on one post affects another → Prevention: Each CommentInput manages state with unique postId

**Server Error Not Caught** → Error doesn't trigger rollback → Prevention: Wrap Server Action call in try-catch, always rollback on error

**Toast Notification Spam** → Multiple errors show multiple toasts → Prevention: Debounce toasts or dismiss previous before showing new

**Accessibility Missing** → Screen readers don't understand comment form → Prevention: Add labels to textarea, announce comment submission success/failure

**Placeholder Text Wrong** → Placeholder not descriptive → Prevention: Use clear text like "Add a comment..." or "Write a comment..."

**Disabled State Not Clear** → User doesn't know input is disabled → Prevention: Reduce opacity, add visual indicator during submission

**Input Not Visible** → Comment input buried or hard to find → Prevention: Place prominently below post image/caption on permalink

**Textarea Styling Inconsistent** → Doesn't match app design → Prevention: Apply consistent styling, border, padding, font

**Optimistic Comment Missing Author** → Optimistic comment doesn't show who posted → Prevention: Include current user's info (from session) in optimistic comment object

**Timestamp Missing** → Optimistic comment has no timestamp → Prevention: Use current Date for optimistic comment, will be replaced by server timestamp

**React 19 Not Available** → Project uses React 18, useOptimistic doesn't exist → Prevention: Verify React 19 installed, or implement manual optimistic pattern

**Hydration Mismatch** → Server renders different state than client → Prevention: Comment input is client component, no hydration issue if properly marked

**Memory Leak from State** → Optimistic comments accumulate in memory → Prevention: Clear optimistic state after server confirmation

**Button Type Not Set** → Button submits form if inside form → Prevention: Set type="button" on button or use form onSubmit handler

**Network Timeout Not Handled** → Request hangs forever → Prevention: Set timeout on Server Action call, treat timeout as error

**Success Feedback Missing** → No indication comment posted successfully → Prevention: Optimistic UI is feedback, but could add subtle animation or toast

**Rollback Animation Timing** → Rollback happens before user sees error → Prevention: Show error toast simultaneously with or just before rollback

**Text Selection Lost** → User selects text, clicks outside, selection lost → Prevention: Expected behavior, not an issue

**Paste Not Working** → User can't paste text → Prevention: Textarea supports paste by default, verify it works

## Testing Verification

### Existing Features Still Work

- [ ]  Permalink page still displays post correctly
- [ ]  Feed still shows comment counts
- [ ]  Like button still works

### New Functionality Works

- [ ]  Comment input appears on permalink page
- [ ]  Textarea accepts multi-line text
- [ ]  Placeholder text shows when empty
- [ ]  Submit button is clickable
- [ ]  Clicking submit with text posts comment
- [ ]  Comment appears immediately at top of list
- [ ]  Textarea clears after successful post
- [ ]  Submit button disabled during submission
- [ ]  Server confirmation completes in background
- [ ]  Comment persists after page reload

### Edge Cases

- [ ]  Empty submission shows error (button disabled or inline error)
- [ ]  Whitespace-only submission shows error
- [ ]  Very long comment (5000+ chars) posts successfully
- [ ]  Comment with emoji posts successfully
- [ ]  Comment with line breaks preserves formatting
- [ ]  Double-clicking submit doesn't create duplicate
- [ ]  Server error shows toast notification
- [ ]  Server error rolls back optimistic update
- [ ]  Failed comment text restored to input
- [ ]  Rapid successive comments work correctly
- [ ]  Keyboard users can tab to textarea and button
- [ ]  Screen reader announces comment submission

---

# Chunk 3: 🎨 Comment Display & Threading

Duration: 3-4 hours | Prerequisites: Chunk 2 complete (comments can be created, optimistic updates working)

## Quick Reference

**Builds:** Comment list display showing all comments with author info, timestamps, and proper formatting

**Connects:** Comment list component → getPostComments query → Individual comment cards

**Pattern:** Server Component fetches comments, renders list with author info and metadata

**Watch For:** Empty comment list state, timestamp formatting, author display, line break rendering

## Context

### User Problem

Users need to see all comments on a post in an organized, readable format with clear attribution and timestamps.

### From Module Brief

- **Comment Display:** Show username (clickable), comment text, timestamp (relative)
- **Chronological Order:** Newest first per Module Brief
- **Flat Threading:** No nested replies, all comments at same level per Master Spec
- **Empty State:** "No comments yet. Be the first to comment!" when no comments
- **Author Info:** Profile picture and username for each comment
- **Clickable Username:** Click username navigates to user profile
- **Timestamp:** Relative format ("2 minutes ago", "5 hours ago", "3 days ago")

## What's Changing

### New Additions

- **CommentList Component:** Displays array of comments with proper formatting
- **CommentCard Component:** Individual comment display with author, text, timestamp
- **Empty Comments State:** Component showing empty state message
- **Comment Author Link:** Clickable username linking to profile
- **Timestamp Formatter:** Utility for relative time display
- **Comment Text Renderer:** Preserves line breaks and handles formatting

### Modifications to Existing

- **Permalink Page (Module 6):** Add CommentList component below CommentInput
- **Post Card in Feed (Module 6):** Verify comment count displays correctly

### No Changes To

- Comment creation from Chunk 2
- Comment deletion (Chunk 4)
- Like functionality from Module 7

## Data Flow

### Comment List Load Flow

1. **Trigger:** User views post permalink page
2. **Server Query:** getPostComments(postId) fetches comments with author data
3. **Data Processing:** Sort by createdAt DESC (newest first)
4. **Render:** Map comments to CommentCard components
5. **Display:** Show list of comments below input
6. **Conditional States:**
    - If comments exist → Render list
    - If no comments → Show empty state
7. **Final State:** All comments visible, properly formatted

### Comment Card Render Flow

1. **Input:** Comment object with text, author info, timestamp
2. **Author Display:** Show profile picture (or default avatar), username
3. **Text Display:** Render comment text with line breaks preserved
4. **Timestamp Display:** Convert createdAt to relative time ("5 minutes ago")
5. **Username Link:** Make username clickable, links to /profile/[username]
6. **Delete Button:** Show delete button if user owns comment or owns post (Chunk 4)
7. **Final Render:** Complete comment card ready for display

## UX Specification

### User Flow

- Trigger: Navigate to post permalink
- Step 1: See comment input at top
- Step 2: See list of comments below input
- Step 3: Read comments in chronological order (newest first)
- Step 4: Click username to view commenter's profile
- Optional: Click delete on own comments

### Empty States

- No comments on post: "No comments yet. Be the first to comment!" with friendly styling

### Loading States

- Comments loading: Skeleton loaders showing 2-3 comment placeholders (optional)
- No explicit loading state needed if part of page load

### Error States

- Comments failed to load: "Couldn't load comments. Try refreshing."

### Responsive Behavior

- Mobile: Single column, compact spacing, profile pics smaller
- Desktop: Comfortable spacing, larger profile pics
- All sizes: Text wraps naturally, line breaks preserved

## Things to Watch For

**Empty Comment List Not Clear** → User doesn't see empty state → Prevention: Make empty state prominent with helpful message

**Line Breaks Not Rendered** → Comments appear as single line → Prevention: Use CSS white-space: pre-wrap on comment text element

**Username Not Clickable** → Clicking username doesn't navigate → Prevention: Wrap username in Link component to profile page

**Deleted User Display** → Comment from deleted user shows broken → Prevention: Handle null author, show "Deleted User" with default avatar

**Timestamp Format Inconsistent** → Some relative, some absolute → Prevention: Use consistent formatter for all timestamps, relative for recent

**Comment Order Wrong** → Oldest first instead of newest → Prevention: Verify ORDER BY createdAt DESC in query, newest at top

**Profile Picture Missing** → Broken image or no fallback → Prevention: Show default avatar if profilePictureUrl is null

**Very Long Comment Breaks Layout** → Long word or URL overflows → Prevention: Use CSS word-wrap: break-word or overflow-wrap: break-word

**Comment Spacing Inconsistent** → Uneven gaps between comments → Prevention: Apply consistent margin/padding to CommentCard components

**No Visual Separation** → Hard to tell where one comment ends and next begins → Prevention: Add subtle borders or background color alternation

**Emoji Not Rendering** → Emoji appear as � or boxes → Prevention: Use UTF-8 encoding throughout, emoji should render by default in React

**Timestamp Never Updates** → "5 minutes ago" stays same after 10 minutes → Prevention: Acceptable for MVP (static), or use client component to refresh timestamps

**Username Truncation** → Long usernames cut off → Prevention: Allow username to wrap or set max-width with ellipsis

**Comment Text XSS** → Malicious HTML in comment executes → Prevention: React escapes text by default, never use dangerouslySetInnerHTML

**N+1 Query for Authors** → Each comment queries author separately → Prevention: Already prevented in Chunk 1 with JOIN, verify implementation

**Comment Count Mismatch** → List shows 5 comments, header says 6 → Prevention: Ensure count query matches actual comments, both query database

**Delete Button Visible for All** → Non-owners see delete button → Prevention: Conditionally render delete button based on ownership (Chunk 4)

**Comment List Not Scrollable** → Very long list with no pagination → Prevention: Allow natural scroll, implement pagination if needed (optional)

**Accessibility Missing** → Screen readers can't navigate comments → Prevention: Use semantic HTML (article or div with role), proper heading hierarchy

**Comment Author Name Styling** → Username not distinct from text → Prevention: Style username bold or different color, make visually distinct

**Timestamp Placement Confusing** → Unclear when comment was posted → Prevention: Place timestamp near username, use subtle color

**Empty State Not Actionable** → Message doesn't encourage commenting → Prevention: Use friendly, inviting text

**Hydration Mismatch** → Server renders different timestamps than client → Prevention: Timestamps from server should match, avoid client-side time manipulation

**Mobile Tap Target Too Small** → Can't tap username on mobile → Prevention: Ensure clickable area minimum 44px, add padding if needed

**Comment Card Styling Flat** → Comments blend together → Prevention: Add subtle shadow, border, or background to distinguish cards

**Author Info Not Aligned** → Profile pic and username misaligned → Prevention: Use flexbox to align profile pic and text properly

**Comment Text Font Size** → Too small or too large → Prevention: Use consistent, readable font size matching app design

**Line Height Cramped** → Multi-line comments hard to read → Prevention: Set comfortable line-height (1.5 or 1.6)

**Comment List Performance** → Rendering 1000 comments is slow → Prevention: Implement pagination or virtualization if posts have many comments (optional for MVP)

**Deleted Comment Still Visible** → After delete, comment remains in view → Prevention: Optimistic removal handled in Chunk 4

**No Feedback on Empty State** → Static empty state is boring → Prevention: Add helpful CTA or friendly icon (optional)

## Testing Verification

### Existing Features Still Work

- [ ]  Permalink page still loads correctly
- [ ]  Comment input still works
- [ ]  Post display still works

### New Functionality Works

- [ ]  Comment list displays below comment input
- [ ]  Comments ordered newest first (top)
- [ ]  Each comment shows profile picture
- [ ]  Each comment shows username
- [ ]  Each comment shows comment text
- [ ]  Each comment shows relative timestamp
- [ ]  Username is clickable and links to profile
- [ ]  Empty state shows when no comments
- [ ]  Line breaks in comments render correctly
- [ ]  Comments with emoji display correctly

### Edge Cases

- [ ]  Post with 0 comments shows empty state
- [ ]  Post with 1 comment displays correctly
- [ ]  Post with 100 comments displays without performance issues
- [ ]  Comment from deleted user shows "Deleted User"
- [ ]  Very long comment wraps properly
- [ ]  Comment with URLs wraps/breaks correctly
- [ ]  Multiple comments from same user display correctly
- [ ]  Clicking username navigates to correct profile
- [ ]  Timestamps display as relative ("5 minutes ago")
- [ ]  Comments with special characters display correctly

---

# Chunk 4: ⚙️ Comment Moderation & Deletion

Duration: 2-3 hours | Prerequisites: Chunk 3 complete (comments displaying in list)

## Quick Reference

**Builds:** Comment deletion functionality with authorization for own comments and post owner moderation

**Connects:** Delete button UI → deleteComment Server Action → Optimistic removal → Count update

**Pattern:** Client component with optimistic deletion, authorization checks, confirmation dialog

**Watch For:** Authorization logic gaps, optimistic rollback, confirmation dialog UX, count sync

## Context

### User Problem

Users need ability to remove their own comments, and post authors need moderation capability to maintain quality on their posts.

### From Module Brief

- **Delete Own Comments:** Users can delete comments they wrote
- **Post Owner Moderation:** Post authors can delete ANY comment on their posts
- **Confirmation Dialog:** "Delete this comment?" before deletion
- **Optimistic UI:** Comment disappears immediately, rolls back on error
- **Count Update:** Comment count decrements after deletion
- **No Edit:** MVP doesn't include comment editing per "Out of Scope"

## What's Changing

### New Additions

- **Delete Button Component:** Shows on comments user can delete (own or post owner)
- **Confirmation Dialog:** Modal or browser confirm before deletion
- **Delete Handler:** Async function with optimistic removal and Server Action call
- **Authorization Display Logic:** Show delete button only when user has permission
- **Optimistic Removal:** Remove comment from list immediately with rollback on error

### Modifications to Existing

- **CommentCard Component (Chunk 3):** Add delete button conditionally based on ownership
- **CommentList Component (Chunk 3):** Handle optimistic comment removal
- **Comment Count Display:** Ensure count updates after deletion

### No Changes To

- Comment creation from Chunk 2
- Comment display from Chunk 3 (except delete button)
- Server Actions from Chunk 1 (already built)

## Data Flow

### Comment Deletion Flow

1. **Trigger:** User clicks delete button on comment
2. **Authorization Check:** UI verifies user can delete (currentUserId === comment.userId OR currentUserId === post.userId)
3. **Confirmation Dialog:** Show "Delete this comment?" with Cancel and Delete buttons
4. **User Confirms:** User clicks Delete button
5. **Optimistic Update:** useOptimistic immediately removes comment from list, decrements count
6. **UI Update:** Comment disappears from view
7. **Server Action Call:** Call deleteComment(commentId) in background
8. **Server-Side Auth:** Re-verify authorization in Server Action
9. **Conditional Branches:**
    - If authorized and success → Keep optimistic state, comment deleted
    - If not authorized → Rollback, show toast "Not authorized to delete this comment"
    - If comment not found → Keep optimistic state (already deleted), no error
    - If database error → Rollback, show toast "Failed to delete comment. Try again."
10. **Final State:** Comment removed from database and UI, or rolled back with error

## UX Specification

### User Flow

- Trigger: User hovers over own comment or comment on own post
- Step 1: See delete button (trash icon or "Delete" text)
- Step 2: Click delete button
- Step 3: See confirmation dialog "Delete this comment?"
- Step 4: Click "Delete" to confirm or "Cancel" to dismiss
- Step 5: Comment immediately disappears from list
- Step 6a (success): Comment stays removed
- Step 6b (failure): Comment reappears, error toast shows

### Empty States

- After deleting last comment: Transitions to "No comments yet" state

### Loading States

- During deletion: Delete button disabled or shows spinner (optional)
- Optimistic removal provides instant feedback

### Error States

- Deletion fails: Toast notification "Failed to delete comment. Try again."
- Not authorized: Toast "Not authorized to delete this comment"

### Responsive Behavior

- Mobile: Delete button visible on tap or always visible for own comments
- Desktop: Delete button appears on hover or always visible
- All sizes: Confirmation dialog centered, readable

## Things to Watch For

**Authorization Logic Error** → User sees delete button when they shouldn't → Prevention: Check currentUserId === comment.userId OR currentUserId === post.userId in UI

**Client-Only Authorization** → Server doesn't verify ownership → Prevention: Always re-check authorization in deleteComment Server Action, never trust client

**Confirmation Bypass** → Comment deleted without confirmation → Prevention: Always show confirmation dialog, make cancel button prominent

**Optimistic Rollback Glitch** → Comment flickers when reappearing → Prevention: Use smooth CSS transitions for comment removal/appearance

**Count Not Updating** → Comment deleted but count stays same → Prevention: Decrement count in optimistic update, verify server returns new count

**Delete Button Always Visible** → Button shows for all users on all comments → Prevention: Conditionally render based on ownership check

**Post Owner Can't Delete** → Post owner sees comments but can't delete → Prevention: Include post.userId in authorization check, not just comment.userId

**Own Comment Not Deletable** → User can't delete own comments → Prevention: Verify comment.userId === currentUserId check works correctly

**Double Delete** → User clicks delete twice rapidly → Prevention: Disable button during deletion using isPending from useTransition

**Comment Already Deleted** → Another user deleted comment while viewing → Prevention: Server returns comment not found, handle gracefully (optimistic state is fine)

**Network Error Handling** → Deletion times out or fails → Prevention: Catch errors, rollback optimistic update, show error toast

**Confirmation Dialog Z-Index** → Dialog appears behind other elements → Prevention: Set high z-index (e.g., 9999) on dialog

**Cancel Button Not Working** → Clicking cancel still deletes → Prevention: Ensure cancel button only closes dialog without calling delete action

**Delete Icon Ambiguous** → User doesn't recognize delete button → Prevention: Use universal trash icon or clear "Delete" text

**Delete Button Positioning** → Button hard to see or click → Prevention: Place consistently (e.g., top right of comment card)

**Keyboard Accessibility** → Can't delete with keyboard → Prevention: Ensure delete button is focusable, Enter/Space trigger confirmation

**Screen Reader Support** → Screen reader doesn't announce deletion → Prevention: Add ARIA labels, announce deletion success

**Mobile Touch Target** → Delete button too small on mobile → Prevention: Ensure minimum 44px tap target

**Confirmation Dialog Mobile** → Dialog doesn't fit on small screen → Prevention: Make dialog responsive, takes most of screen on mobile

**Optimistic Comment ID Missing** → Can't remove optimistic comment from list → Prevention: Ensure optimistic comments have temporary IDs that match for removal

**Count Goes Negative** → Deleting when count is 0 → Prevention: Use Math.max(0, count - 1) in optimistic update

**Multiple Comments Deleted** → Deleting one affects others → Prevention: Each comment has unique ID, deletion targets specific ID

**Authorization Data Missing** → Don't have post.userId to check ownership → Prevention: Include post.userId in comment query results or fetch separately

**Error Message Not Clear** → Generic error doesn't help user → Prevention: Show specific messages: "Not authorized" vs "Failed to delete"

**Delete Animation Jarring** → Abrupt removal looks broken → Prevention: Add fade-out or slide-out animation before removal

**Rollback Animation Missing** → Comment reappears abruptly → Prevention: Add fade-in or slide-in animation on rollback

**Confirmation Dialog Style** → Dialog doesn't match app design → Prevention: Style confirmation dialog consistently with app

**Browser Confirm Used** → Using window.confirm() is not ideal → Prevention: Use custom modal dialog for better UX and styling control

**Delete Button State After Error** → Button stays disabled after error → Prevention: Re-enable button after error, allow retry

**Toast Notification Missing** → User doesn't know deletion failed → Prevention: Always show toast on error

**Success Feedback Excessive** → Toast for every successful deletion is annoying → Prevention: No success toast needed, optimistic removal is sufficient feedback

**Moderation Abuse** → Post owner deletes all negative comments → Prevention: This is allowed per spec, post owner has full moderation rights

## Testing Verification

### Existing Features Still Work

- [ ]  Comment input still works
- [ ]  Comment list still displays
- [ ]  Comment creation still works

### New Functionality Works

- [ ]  Delete button appears on own comments
- [ ]  Delete button appears on all comments for post owner
- [ ]  Delete button does NOT appear on other users' comments (non-post-owner)
- [ ]  Clicking delete shows confirmation dialog
- [ ]  Confirmation dialog has Cancel and Delete buttons
- [ ]  Clicking Cancel closes dialog without deleting
- [ ]  Clicking Delete removes comment immediately
- [ ]  Comment count decrements after deletion
- [ ]  Comment stays removed after page reload
- [ ]  Failed deletion shows error toast
- [ ]  Failed deletion rolls back optimistic removal

### Edge Cases

- [ ]  User A can delete their own comment on User B's post
- [ ]  User B (post owner) can delete User A's comment on their post
- [ ]  User C cannot delete comment they don't own on post they don't own
- [ ]  Deleting last comment shows empty state
- [ ]  Rapid delete clicks don't cause issues (button disabled)
- [ ]  Network error during delete shows error and rolls back
- [ ]  Deleting already-deleted comment handled gracefully
- [ ]  Keyboard users can trigger delete with Enter
- [ ]  Screen reader announces deletion
- [ ]  Mobile confirmation dialog displays correctly
- [ ]  Deleting post with 50 comments removes all (cascade test from Module 6)

---

## Feature Acceptance Tests

**Run these after all 4 chunks are complete to verify the full Module 8 feature works:**

### Core Tests (from Module Brief)

- [ ]  Post comment on post → Comment appears immediately
- [ ]  Refresh page → Comment still visible
- [ ]  Post multiple comments → All appear in chronological order (newest first)
- [ ]  Delete own comment → Confirmation shown → Comment removed
- [ ]  Post author deletes any comment → Confirmation shown → Comment removed
- [ ]  Non-post-author views post → Cannot delete others' comments (no button)
- [ ]  Try to submit empty comment → Validation error shown

### Edge Cases (from Module Brief)

- [ ]  Comment with 5000 characters → Posts and displays successfully
- [ ]  Comment with HTML tags → Rendered as plain text (no XSS)
- [ ]  Server error during comment post → UI rolls back, error shown
- [ ]  Click username in comment → Navigate to correct profile
- [ ]  Post with 100 comments → All load and display correctly
- [ ]  Delete comment → comment count decrements

### Integration Tests (from Module Brief)

- [ ]  User A posts comment on User B's post → User B can delete it (post author moderation)
- [ ]  User A posts comment → User A can delete it → User C cannot delete it
- [ ]  Create post → add comment → delete post → comment also deleted (cascade)
- [ ]  Like post, comment on post → Both features work independently
- [ ]  Comment count in feed matches actual comments on permalink

---

## Implementation Notes

**React 19 useOptimistic:**

Ensure React 19 is installed for native optimistic UI. If React 18, implement manual pattern with useState and useTransition.

**Database Constraints:**

Verify in Drizzle schema:

- Foreign key postId references posts(id) ON DELETE CASCADE
- Foreign key userId references users(id) ON DELETE CASCADE
- Indexes on comments.postId and comments.userId for performance
- text field NOT NULL

**Authorization Pattern:**

```tsx
// In CommentCard component:
const canDelete = [currentUser.id](http://currentUser.id) === comment.userId || [currentUser.id](http://currentUser.id) === post.userId

// In deleteComment Server Action:
const comment = await getComment(commentId)
const post = await getPost(comment.postId)
if (currentUserId !== comment.userId && currentUserId !== post.userId) {
  return { error: 'Not authorized' }
}
```

**Optimistic Update Pattern:**

```tsx
const [optimisticComments, removeOptimistic] = useOptimistic(
  comments,
  (state, commentIdToRemove) => state.filter(c => [c.id](http://c.id) !== commentIdToRemove)
)
```

**Performance Considerations:**

- Comment queries should use indexes on postId
- Batch fetch comment authors with JOIN, not N+1 queries
- Consider pagination if posts have 100+ comments (optional for MVP)
- Textarea should not lag with very long text

**Accessibility Checklist:**

- [ ]  Textarea has label or aria-label
- [ ]  Submit button clearly labeled
- [ ]  Delete button has aria-label: "Delete comment"
- [ ]  Confirmation dialog has proper focus management
- [ ]  Comment submission announced to screen readers
- [ ]  Username links have proper context

**Security Checklist:**

- [ ]  Server Actions verify authentication
- [ ]  Delete action verifies authorization (own comment or post owner)
- [ ]  Comment text stored as plain text, rendered safely
- [ ]  No SQL injection (parameterized queries)
- [ ]  XSS prevented (React escapes by default)
- [ ]  Error messages don't expose sensitive data