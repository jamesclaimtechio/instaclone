# Feature: Likes System (Module 7)

**Core Problem:** Enable users to express appreciation for posts through quick, reversible like actions with immediate UI feedback via optimistic updates.

**Total Chunks:** 3

**Total Estimated Duration:** 8-12 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Module 6 (Photo Posts & Feed)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Likes Data Layer | 📊 Data | 2-3 hrs | Module 6 complete (posts displaying in feed) |
| 2 | Like Button UI with Optimistic Updates | 🎨 UI | 4-6 hrs | Chunk 1 complete (like Server Actions working) |
| 3 | Like State Persistence & Edge Cases | ⚙️ Logic | 2-3 hrs | Chunk 2 complete (like button interactive) |

---

# Chunk 1: 📊 Likes Data Layer

Duration: 2-3 hours | Prerequisites: Module 6 complete (posts table populated, feed displaying posts)

## Quick Reference

**Builds:** Database operations for creating and deleting likes with proper authorization and constraints

**Connects:** Likes table → Server Actions for like/unlike → Feed queries with like counts

**Pattern:** Drizzle ORM inserts/deletes with composite unique constraints, JOIN queries for counts

**Watch For:** Duplicate like prevention, race conditions on toggle, negative like counts, authorization gaps

## Context

### User Problem

Users need a backend system that reliably stores their likes, prevents duplicates, and quickly tells them which posts they've liked.

### From Module Brief

- **Toggle Behavior:** User can like (insert) or unlike (delete) same post
- **Like Count:** Each post shows total number of likes
- **Like State:** System remembers which posts current user has liked
- **Authorization:** Only authenticated users can like posts
- **Data Integrity:** User cannot like same post twice (database constraint)
- **Cascade Delete:** When post deleted, all its likes are deleted (from Module 6)

## What's Changing

### New Additions

- **likePost Server Action:** Accepts postId, creates like record for current user, returns new like count
- **unlikePost Server Action:** Accepts postId, deletes like record for current user, returns new like count
- **getLikeStatus query function:** Checks if current user has liked a specific post (returns boolean)
- **getLikeCount query function:** Returns total like count for a post
- **getUserLikes query function:** Returns array of postIds that current user has liked (for batch checking)

### Modifications to Existing

- **getFeedPosts query (Module 6):** Must now include like count and whether current user has liked each post
- **getPostById query (Module 6):** Must include like count and current user's like status

### No Changes To

- Post creation from Module 6
- Feed UI rendering (Chunk 2 will add interactive buttons)
- User authentication from Module 2

## Data Flow

### Like Creation Flow

1. **Trigger:** User clicks heart icon on unliked post
2. **Authentication Check:** Verify user is authenticated and session valid
3. **Server Action Call:** likePost(postId) called with postId
4. **Validation:** Check postId is valid UUID, post exists
5. **Database Insert:** INSERT INTO likes (postId, userId, createdAt) VALUES (...)
6. **Unique Constraint:** Database enforces unique (postId, userId) - prevents duplicates
7. **Count Query:** SELECT COUNT(*) FROM likes WHERE postId = $1
8. **Conditional Branches:**
    - If insert success → return { success: true, likeCount: X }
    - If duplicate constraint violation → return { success: true, likeCount: X } (idempotent, already liked)
    - If post not found → return error "Post not found"
    - If not authenticated → return error "Not authenticated"
    - If database error → return error "Failed to like post"
9. **Final State:** Like record exists, count incremented

### Unlike Flow

1. **Trigger:** User clicks filled heart icon on liked post
2. **Authentication Check:** Verify user is authenticated
3. **Server Action Call:** unlikePost(postId) called
4. **Validation:** Check postId is valid UUID
5. **Database Delete:** DELETE FROM likes WHERE postId = $1 AND userId = $2
6. **Count Query:** SELECT COUNT(*) FROM likes WHERE postId = $1
7. **Conditional Branches:**
    - If delete success (rows affected = 1) → return { success: true, likeCount: X }
    - If no rows affected → return { success: true, likeCount: X } (idempotent, already unliked)
    - If not authenticated → return error "Not authenticated"
    - If database error → return error "Failed to unlike post"
8. **Final State:** Like record removed, count decremented

### Like State Query Flow

1. **Trigger:** Feed page loads or user navigates to post
2. **Batch Query:** SELECT postId FROM likes WHERE userId = $1 AND postId IN ($2, $3, $4...)
3. **Result Processing:** Convert result to Set of postIds for O(1) lookup
4. **Return:** Boolean or Set indicating which posts are liked

## Things to Watch For

**Duplicate Like Race Condition** → Two rapid clicks create two like records → Prevention: Unique composite constraint on (postId, userId) in database schema, handle constraint violation gracefully

**Authentication Bypass** → Unauthenticated user sends like request → Prevention: Check session exists at start of Server Action, return error if no valid session

**Negative Like Count** → Unlike happens when count is already 0 → Prevention: Verify count never goes below 0, use COALESCE and MAX(0, count) in queries

**Post Not Found** → User tries to like deleted post → Prevention: Check post exists before inserting like, return clear error "Post not found"

**Foreign Key Violation** → Like references non-existent post or user → Prevention: Ensure foreign key constraints in schema, validate IDs before insert

**Count Query Performance** → Counting likes on every like/unlike is slow → Prevention: Use indexed COUNT query, test with posts with 1000+ likes, consider caching for very popular posts

**Stale Like Counts** → Feed shows old count after like → Prevention: Ensure getFeedPosts query computes counts in real-time with LEFT JOIN and COUNT

**Missing Cascade Delete** → Post deleted but likes remain → Prevention: Verify foreign key has ON DELETE CASCADE in Drizzle schema

**SQL Injection in postId** → Malicious postId string breaks query → Prevention: Use parameterized queries with Drizzle, validate UUID format before querying

**Like Own Post** → User likes their own post → Prevention: Allow this per spec (no restriction mentioned), common in social platforms

**Batch Query N+1 Problem** → Checking like status for each post separately → Prevention: Use IN clause to fetch all like statuses in single query for current page of posts

**Invalid UUID Format** → postId is malformed UUID → Prevention: Validate UUID format before database operations, return clear error

**Session Expiration Mid-Action** → User's session expires between page load and like → Prevention: Check session validity in Server Action, return authentication error

**Double Unlike** → User unlikes post twice rapidly → Prevention: DELETE is idempotent, check rows affected but don't error if 0 rows

**Count Consistency** → Count returned doesn't match actual count → Prevention: Query count immediately after insert/delete in same transaction

**Transaction Isolation Issues** → Concurrent likes might cause count inconsistencies → Prevention: Use default READ COMMITTED isolation, COUNT query accurate at time of execution

**Memory Leak with getUserLikes** → Fetching thousands of liked posts → Prevention: Only fetch likes for posts on current page (use IN clause with post IDs)

**Like State on Permalink** → Permalink page doesn't show correct like state → Prevention: Include like status in getPostById query

**Error Message Leakage** → Database constraint errors expose schema → Prevention: Catch constraint violations, return generic success (idempotent behavior)

**Timezone Issues with createdAt** → Likes timestamped inconsistently → Prevention: Store all timestamps in UTC (Postgres default)

**Index Missing on Foreign Keys** → Queries slow due to unindexed foreign keys → Prevention: Ensure indexes on likes.postId and likes.userId

**Count as NULL** → COUNT returns null instead of 0 → Prevention: Use COALESCE(COUNT(*), 0) or handle null in application layer

**Optimistic Lock Failure** → Two users like at exact same moment → Prevention: No locking needed, each gets their own like record

**Deleted User Edge Case** → User deleted but their likes remain → Prevention: Foreign key on userId with ON DELETE CASCADE

**Like Spam Prevention** → User rapidly likes/unlikes same post → Prevention: No rate limiting in MVP, but consider debouncing in UI layer (Chunk 2)

**Authorization on Unlike** → User tries to unlike another user's like → Prevention: Unlike only deletes current user's like (WHERE userId = $currentUser), no authorization check needed beyond authentication

**Boolean vs Count Return** → Inconsistent return types from Server Actions → Prevention: Standardize on returning { success: boolean, likeCount: number, isLiked: boolean }

**Database Connection Pool Exhaustion** → Many simultaneous likes exhaust connections → Prevention: Drizzle + Neon handle connection pooling, test under load

**Incorrect Join Type** → INNER JOIN instead of LEFT JOIN for counts → Prevention: Use LEFT JOIN so posts with 0 likes still appear in feed

**Cascade to Comments** → Likes cascade delete when they shouldn't → Prevention: Only post deletion cascades to likes, not user or comment deletion

**Audit Trail Missing** → No record of who liked what when → Prevention: createdAt timestamp provides basic audit, sufficient for MVP

## Testing Verification

### Existing Features Still Work

- [ ]  Feed displays posts correctly
- [ ]  Post creation still works
- [ ]  Post permalink still loads
- [ ]  User authentication still validates

### New Functionality Works

- [ ]  likePost Server Action successfully inserts like record
- [ ]  unlikePost Server Action successfully deletes like record
- [ ]  Like count increases from 0 to 1 when first user likes
- [ ]  Like count decreases from 1 to 0 when only user unlikes
- [ ]  getLikeStatus returns true for liked posts
- [ ]  getLikeStatus returns false for unliked posts
- [ ]  getFeedPosts includes like count for each post
- [ ]  getFeedPosts includes isLiked status for current user
- [ ]  getPostById includes like count
- [ ]  getPostById includes isLiked status

### Edge Cases

- [ ]  Liking same post twice returns success (idempotent)
- [ ]  Unliking non-liked post returns success (idempotent)
- [ ]  Liking deleted post returns error
- [ ]  Unauthenticated like request returns error
- [ ]  Invalid post UUID returns error
- [ ]  Multiple users can like same post, count increments for each
- [ ]  Like count never goes negative
- [ ]  Deleting post cascades to delete all its likes
- [ ]  Post with 100 likes shows correct count
- [ ]  Feed with 50 posts queries like status efficiently (single query)

---

# Chunk 2: 🎨 Like Button UI with Optimistic Updates

Duration: 4-6 hours | Prerequisites: Chunk 1 complete (likePost/unlikePost Server Actions working, like counts querying correctly)

## Quick Reference

**Builds:** Interactive heart icon button with optimistic UI using React 19's useOptimistic hook for instant feedback

**Connects:** Like button component → Server Actions (like/unlike) → Optimistic state management → UI updates

**Pattern:** React Client Component with useOptimistic, useTransition for async actions, toggle state management

**Watch For:** Optimistic rollback failures, double-click prevention, state sync issues, animation glitches

## Context

### User Problem

Users expect instant feedback when liking posts without waiting for server confirmation, with smooth animations and reliable state updates.

### From Module Brief

- **Heart Icon:** Empty heart for unliked posts, filled heart for liked posts
- **Toggle Behavior:** Click to like, click again to unlike
- **Optimistic UI:** Use React 19's useOptimistic for immediate updates before server confirmation
- **Like Count Display:** Shows numeric count ("5 likes", "1 like", "0 likes")
- **Real-Time Updates:** Count and state update immediately when user interacts
- **Error Handling:** Rollback optimistic update if server action fails, show toast notification
- **Visual Feedback:** Heart icon fills with color, count increments, smooth animation
- **Location:** Heart button appears on feed post cards and permalink page

## What's Changing

### New Additions

- **LikeButton Component:** Client component with heart icon, like count, click handler
- **Optimistic State Hook:** Uses useOptimistic to manage local like state before server confirmation
- **Like Action Handler:** Async function that updates optimistic state, calls Server Action, handles errors
- **Heart Icon Animation:** CSS or animation library for smooth fill/unfill transition
- **Toast Notification System:** For error messages when like/unlike fails
- **Double-Click Prevention:** Debouncing or state flag to prevent multiple simultaneous requests

### Modifications to Existing

- **Post Card Component (Module 6):** Add LikeButton component below image or in metadata section
- **Permalink Page (Module 6):** Add LikeButton component in post metadata section
- **Feed Query Results:** Ensure like count and isLiked status are passed to PostCard components

### No Changes To

- Server Actions from Chunk 1 (backend logic remains same)
- Comment button (Module 8)
- Follow button (Module 9)

## Data Flow

### Optimistic Like Flow

1. **Trigger:** User clicks empty heart icon
2. **Optimistic Update:** useOptimistic immediately sets isLiked to true, increments count by 1
3. **UI Update:** Heart icon fills with color, count shows new number
4. **Server Action Call:** Call likePost(postId) in background
5. **Server Response:** Wait for Server Action to complete
6. **Conditional Branches:**
    - If success → Keep optimistic state, mark as confirmed
    - If error → Rollback optimistic state (heart empties, count decrements), show toast "Action failed. Try again."
7. **Final State:** UI matches server state

### Optimistic Unlike Flow

1. **Trigger:** User clicks filled heart icon
2. **Optimistic Update:** useOptimistic immediately sets isLiked to false, decrements count by 1
3. **UI Update:** Heart icon empties, count shows new number
4. **Server Action Call:** Call unlikePost(postId) in background
5. **Server Response:** Wait for Server Action to complete
6. **Conditional Branches:**
    - If success → Keep optimistic state, mark as confirmed
    - If error → Rollback optimistic state (heart fills, count increments), show toast "Action failed. Try again."
7. **Final State:** UI matches server state

## UX Specification

### User Flow

- Trigger: Click heart icon below post image
- Step 1: Heart immediately fills with color (or empties if already liked)
- Step 2: Count immediately updates (increments or decrements by 1)
- Step 3: Background server request processes
- Step 4a (success): No visible change, state persists
- Step 4b (failure): Heart and count revert to previous state, error toast appears

### Empty States

- Post with 0 likes: Shows "0 likes" with empty heart icon

### Loading States

- No explicit loading state needed due to optimistic UI
- Optional: Subtle opacity change or pulse animation during server request (advanced)

### Error States

- Server action fails: Toast notification "Action failed. Try again." at top of screen
- Network timeout: Same toast notification after timeout
- Authentication error: Toast "Please log in to like posts"

### Responsive Behavior

- Mobile: Heart icon minimum 44px tap target, count text readable
- Desktop: Hover state shows pointer cursor and subtle scale effect
- All sizes: Heart icon and count always visible, not cut off

## Things to Watch For

**Double-Click Race Condition** → User clicks heart twice rapidly before first request completes → Prevention: Disable button or ignore clicks while request in flight using isPending from useTransition

**Optimistic Rollback Visual Glitch** → Heart flickers when rolling back → Prevention: Use smooth CSS transitions, ensure rollback animation matches forward animation

**State Sync After Navigation** → User likes post, navigates away, returns, state stale → Prevention: Server state is source of truth on page load, optimistic only for current session

**Count Goes Negative** → Optimistic decrement when count is 0 → Prevention: Check count > 0 before allowing optimistic decrement, or use Math.max(0, count - 1)

**Server Error Not Caught** → Error doesn't trigger rollback → Prevention: Wrap Server Action call in try-catch, always rollback on error

**Toast Notification Spam** → Multiple errors show multiple toasts → Prevention: Debounce toast notifications or queue them

**Heart Icon Not Changing** → Optimistic state updates but icon doesn't re-render → Prevention: Ensure icon component re-renders when isLiked changes

**Animation Performance** → Heart fill animation causes jank on low-end devices → Prevention: Use CSS transforms and opacity (GPU accelerated), avoid layout changes

**Like Count Formatting** → Count shows "1 likes" instead of "1 like" → Prevention: Conditional text: count === 1 ? "1 like" : `${count} likes`

**Accessibility Missing** → Screen readers don't announce like action → Prevention: Add ARIA label to button, announce state changes

**Keyboard Access** → Can't like with keyboard → Prevention: Button element is keyboard accessible by default, ensure Enter/Space trigger action

**Focus State Missing** → No visible focus indicator for keyboard users → Prevention: Style :focus-visible state on button

**Touch Feedback Missing** → No visual feedback on mobile tap → Prevention: Add :active state with slight scale down or color change

**Optimistic State Persists After Error** → Rollback doesn't happen → Prevention: useOptimistic automatically rolls back, but verify in testing

**Multiple Posts Share State** → Liking one post affects another → Prevention: Each LikeButton manages its own state with unique postId

**Icon Library Issues** → Heart icon doesn't render or loads slowly → Prevention: Use lightweight icon library or inline SVG, preload icons

**Color Contrast** → Filled heart not visible on certain backgrounds → Prevention: Choose high-contrast color (e.g., red #FF0000), test on all background colors

**Count Position Shifts** → Count changing from single to double digit shifts layout → Prevention: Use monospace font or fixed width for count container

**Server Action Import Error** → Client component can't import Server Action → Prevention: Ensure Server Action marked "use server", imported correctly

**Hydration Mismatch** → Server renders unliked, client expects liked → Prevention: Pass initial like state from server, use suppressHydrationWarning if timestamps differ

**Stale Closure in Handler** → Click handler uses old count value → Prevention: Use optimistic state, not local state, or use functional updates

**React 19 Not Available** → Project uses React 18, useOptimistic doesn't exist → Prevention: Verify React 19 installed, or implement manual optimistic UI pattern

**useTransition Missing** → isPending not available to disable button → Prevention: Use useTransition hook from React, destructure isPending

**Toast Z-Index Issue** → Toast appears behind other elements → Prevention: Set high z-index (e.g., 9999) on toast container

**Memory Leak from Listeners** → Event listeners not cleaned up → Prevention: React handles this automatically for onClick handlers

**Button Type Not Set** → Button submits form if inside form → Prevention: Set type="button" on button element

**Spam Prevention Missing** → User rapidly likes/unlikes to spam → Prevention: isPending prevents multiple simultaneous requests, backend is idempotent

**Network Timeout Not Handled** → Request hangs forever on slow network → Prevention: Set timeout on Server Action call, show error after timeout

**Rollback Animation Timing** → Rollback happens before error is visible → Prevention: Show error toast first or simultaneously with rollback

**Count Not Re-fetched** → After rollback, count might be stale → Prevention: Rollback returns to previous known state, next page load will refresh from server

**Like Button in Wrong Location** → Button not visible or poorly positioned → Prevention: Place prominently in post card, typically below image or in action bar

**Icon Size Inconsistent** → Heart icon different sizes on feed vs permalink → Prevention: Use consistent sizing props, test both locations

**Server State Overrides Optimistic** → Server response causes flash of old state → Prevention: Only update state if optimistic update completed, or merge states carefully

## Testing Verification

### Existing Features Still Work

- [ ]  Feed displays posts correctly
- [ ]  Post cards still render all metadata
- [ ]  Clicking post image still navigates to permalink
- [ ]  Username still navigates to profile

### New Functionality Works

- [ ]  Like button appears on all posts in feed
- [ ]  Like button appears on permalink page
- [ ]  Empty heart icon shows for unliked posts
- [ ]  Filled heart icon shows for liked posts
- [ ]  Clicking empty heart fills icon immediately
- [ ]  Like count increments immediately when clicked
- [ ]  Clicking filled heart empties icon immediately
- [ ]  Like count decrements immediately when clicked
- [ ]  Server action completes in background
- [ ]  State persists after successful server action
- [ ]  Page reload shows correct like state

### Edge Cases

- [ ]  Double-clicking heart doesn't cause issues (button disabled during request)
- [ ]  Server error shows toast notification
- [ ]  Server error rolls back optimistic update
- [ ]  Liking post with 0 likes shows "1 like" not "1 likes"
- [ ]  Unliking post with 1 like shows "0 likes"
- [ ]  Multiple posts in feed each have independent like state
- [ ]  Rapid like/unlike on same post works correctly
- [ ]  Network timeout shows error and rolls back
- [ ]  Keyboard users can like/unlike with Enter key
- [ ]  Screen reader announces like action
- [ ]  Mobile tap has visual feedback
- [ ]  Heart fill animation is smooth (no flicker)

---

# Chunk 3: ⚙️ Like State Persistence & Edge Cases

Duration: 2-3 hours | Prerequisites: Chunk 2 complete (like button interactive, optimistic updates working)

## Quick Reference

**Builds:** Robust like state management across navigation, error recovery, and edge case handling

**Connects:** Like state → Navigation events → Page reloads → Error boundaries → Data consistency

**Pattern:** Server-side state as source of truth, client-side optimistic updates with reconciliation

**Watch For:** Stale state after navigation, inconsistent counts across views, unhandled error scenarios

## Context

### User Problem

Users expect their likes to persist correctly across page navigation, reloads, and different views of the same post, with reliable error recovery.

### From Module Brief

- **State Persistence:** Liked posts show filled hearts after page reload
- **Cross-View Consistency:** Liking post in feed shows as liked on permalink and vice versa
- **Error Recovery:** Failed likes can be retried without loss of user intent
- **Data Consistency:** Like counts are accurate across all views of a post
- **No Phantom Likes:** Optimistic updates that fail don't leave UI in wrong state permanently

## What's Changing

### New Additions

- **State Reconciliation Logic:** Ensure optimistic state reconciles with server state on page load
- **Navigation State Management:** Preserve like state during client-side navigation
- **Error Boundary:** Catch like-related errors and provide recovery UI
- **Retry Mechanism:** Allow users to retry failed like actions
- **Toast Retry Button:** Error toast includes retry option
- **Like Count Validation:** Ensure counts never go negative, stay in sync

### Modifications to Existing

- **Feed Query:** Ensure like counts and states are always fresh on page load
- **Permalink Query:** Ensure like state consistent with feed
- **Profile Posts Grid (Module 4):** Add like counts to profile post displays (optional enhancement)

### No Changes To

- Server Actions from Chunk 1 (backend remains unchanged)
- Like button UI from Chunk 2 (visual design remains same)

## Data Flow

### Page Load State Reconciliation

1. **Trigger:** User navigates to feed or permalink page
2. **Server Query:** Fetch posts with like counts and isLiked status
3. **Initial Render:** Render posts with server state
4. **Client Hydration:** Like buttons become interactive with correct initial state
5. **No Optimistic Conflict:** If user hasn't interacted, state matches server
6. **Final State:** All like buttons show correct state from server

### Navigation State Preservation

1. **Trigger:** User likes post in feed, then navigates to permalink
2. **Client Navigation:** Next.js client-side navigation
3. **Query Execution:** getPostById fetches post with current like state from database
4. **State Display:** Permalink shows liked state (heart filled)
5. **Consistency Check:** State matches what user saw in feed
6. **Final State:** Consistent like state across views

### Error Recovery Flow

1. **Trigger:** User likes post, server action fails
2. **Error Caught:** Error handler in like button catches failure
3. **Optimistic Rollback:** UI reverts to unliked state
4. **Error Toast:** Toast displays "Action failed. Try again." with Retry button
5. **User Clicks Retry:** Retry button triggers same like action again
6. **Conditional Branches:**
    - If retry succeeds → Toast dismisses, like persists
    - If retry fails → Show error again, allow another retry
7. **Final State:** Eventually consistent or user abandons

### Count Validation Flow

1. **Trigger:** Any like/unlike action
2. **Count Check:** Before updating UI, verify count operation is valid
3. **Validation Rules:**
    - Count never negative (enforce count >= 0)
    - Increment only if not already liked
    - Decrement only if currently liked
4. **Safe Update:** Apply validated count change
5. **Final State:** Counts remain consistent and accurate

## Things to Watch For

**Stale State After Back Button** → User likes post, navigates away, presses back, state stale → Prevention: Next.js refreshes data on back navigation, or implement cache revalidation

**Inconsistent Counts Between Views** → Feed shows 5 likes, permalink shows 4 → Prevention: Both views query database in real-time, ensure no caching issues

**Optimistic State Survives Reload** → User likes post, closes tab before server response, reopens, shows liked → Prevention: Optimistic state only in memory, page reload fetches from server

**Failed Like Not Retryable** → Error toast disappears, user can't retry → Prevention: Add retry button to toast, or keep like button functional for retry

**Multiple Failed Retries** → User retries 5 times, all fail, no guidance → Prevention: After 3 failed attempts, suggest "Please check your connection" or disable retry

**Count Drift Over Time** → Small inconsistencies accumulate causing count errors → Prevention: Always fetch counts from database, never compute from previous count + delta

**Orphaned Optimistic Updates** → Optimistic update made but component unmounts before resolution → Prevention: Cleanup in useEffect return, or accept that unmounted components don't need cleanup

**Database Read After Write** → Like inserted but count query reads stale data → Prevention: Query count in same transaction or immediately after, use READ COMMITTED isolation

**Cache Invalidation Missing** → Next.js cache serves stale like counts → Prevention: Use revalidatePath or revalidateTag after like/unlike actions

**Hydration State Mismatch** → Server says unliked, client hydrates as liked → Prevention: Don't use localStorage for like state, always use server state as initial

**localStorage Sync Attempt** → Trying to sync likes to localStorage for offline → Prevention: Not required in MVP, online-only acceptable per spec

**Negative Count in UI** → Display shows "-1 likes" → Prevention: Use Math.max(0, count) in display logic, enforce on backend

**Count Formatting Inconsistency** → Sometimes "5 likes", sometimes "5" → Prevention: Use consistent formatting helper function across all components

**Retry Spam** → User clicks retry 20 times rapidly → Prevention: Debounce retry button, or use same isPending logic as original button

**Error Toast Persists Forever** → Toast doesn't auto-dismiss → Prevention: Auto-dismiss error toasts after 5-7 seconds (but keep retry button)

**No Error Logging** → Failed likes not logged for debugging → Prevention: Log errors server-side with user ID, post ID, timestamp

**Partial Page Updates** → Like count updates but heart icon doesn't → Prevention: Ensure both state values come from same source (optimistic state hook)

**Race Between Multiple Tabs** → User opens post in two tabs, likes in both, conflict → Prevention: Each tab operates independently, database constraint prevents duplicate, both see correct final state

**Unlike Button Not Working** → Unlike fails but like works → Prevention: Test both paths equally, ensure unlike Server Action works

**Count Off by One** → Count shows 5 but database has 6 likes → Prevention: Always query database for count, don't rely on increment/decrement math

**Optimistic Update Before Auth Check** → UI updates before checking if user logged in → Prevention: Check authentication before optimistic update, or accept rollback if auth fails

**Server Action Timeout** → Action takes 30+ seconds, no timeout → Prevention: Set reasonable timeout (5-10 seconds), treat timeout as error

**No Feedback on Success** → User doesn't know if like persisted → Prevention: Optimistic UI provides feedback, no additional success toast needed (avoid toast spam)

**Failed Unlike Shows Error** → Unlike fails but shouldn't be visible error → Prevention: Unlike failure less critical than like failure, could silently retry or just log

**Deleted Post While Liking** → User likes post as admin deletes it → Prevention: Server returns "Post not found" error, show appropriate message

**Count Revalidation Missing** → Next.js doesn't refetch counts on focus → Prevention: Configure SWR or similar for auto-revalidation, or manual revalidation

**Profile Page Shows Wrong Counts** → Profile posts show stale like counts → Prevention: Ensure profile queries include current like counts from database

**Client-Side Routing Cache** → Next.js caches page with old counts → Prevention: Use dynamic routes or disable caching for like-sensitive pages

**No Loading Indicator on Retry** → Retry button doesn't show loading state → Prevention: Apply same isPending logic to retry button

**Error Boundary Catches Too Much** → Error boundary catches all errors, not just like errors → Prevention: Specific error handling in like button, error boundary as last resort

**State Reset on Refresh** → User likes 5 posts, refreshes, all show unliked → Prevention: This indicates server state not persisting, verify database writes succeeding

## Testing Verification

### Existing Features Still Work

- [ ]  Feed loads correctly
- [ ]  Like buttons work as expected from Chunk 2
- [ ]  Navigation still works smoothly

### New Functionality Works

- [ ]  Like post in feed, refresh page, post still shows as liked
- [ ]  Like post in feed, navigate to permalink, post shows as liked
- [ ]  Like post on permalink, navigate to feed, post shows as liked
- [ ]  Failed like shows error toast with retry button
- [ ]  Clicking retry button attempts like action again
- [ ]  Successful retry removes error toast
- [ ]  Like counts never show negative numbers
- [ ]  Like count in feed matches count on permalink

### Edge Cases

- [ ]  Like post, close browser, reopen, post still shows as liked
- [ ]  Like post, log out, log back in, post still shows as liked
- [ ]  Like post in one browser tab, refresh other tab, both show liked
- [ ]  Rapid retries don't cause duplicate likes
- [ ]  Error after 3 retries shows helpful message
- [ ]  Unlike after failed like attempt works correctly
- [ ]  Navigating back from permalink to feed preserves like state
- [ ]  Post with 0 likes never shows negative count
- [ ]  Post with 1000 likes shows count correctly formatted
- [ ]  Liking deleted post shows clear error
- [ ]  Network disconnect during like recovers gracefully

---

## Feature Acceptance Tests

**Run these after all 3 chunks are complete to verify the full Module 7 feature works:**

### Core Tests (from Module Brief)

- [ ]  Click heart on unliked post → Heart fills, count increments by 1
- [ ]  Click heart on liked post → Heart empties, count decrements by 1
- [ ]  Like post → refresh page → Heart still filled
- [ ]  Unlike post → refresh page → Heart still empty
- [ ]  Like post → Server Action fails (simulate) → UI rolls back, toast shown

### Edge Cases (from Module Brief)

- [ ]  Rapidly click heart 10 times → Final state is consistent (no race conditions)
- [ ]  Like post with 0 likes → Count goes to 1
- [ ]  Unlike post with 1 like → Count goes to 0, not negative
- [ ]  Two users like same post → Count increments for both
- [ ]  User A likes post → User B sees updated count (after refresh)

### Integration Tests (from Module Brief)

- [ ]  Delete post with 10 likes → All 10 like records deleted (cascade)
- [ ]  Like 50 posts in feed → All show as liked
- [ ]  Unlike 25 of those posts → All show as unliked
- [ ]  Navigate between feed and permalink → Like state consistent
- [ ]  Like post on slow network → Optimistic update immediate, server confirms later

---

## Implementation Notes

**React 19 useOptimistic Hook:**

Ensure project uses React 19 for native optimistic UI support. If React 18, implement manual optimistic pattern with useState and useTransition.

**Database Constraints:**

Verify in Drizzle schema:

- Unique constraint on (postId, userId) in likes table
- Foreign key postId references posts(id) ON DELETE CASCADE
- Foreign key userId references users(id) ON DELETE CASCADE
- Indexes on postId and userId for query performance

**Server Action Pattern:**

```tsx
// Example structure (not actual code):
export async function likePost(postId: string) {
  'use server'
  // 1. Validate authentication
  // 2. Validate postId format
  // 3. Insert like with error handling
  // 4. Query new like count
  // 5. Return { success, likeCount, isLiked }
}
```

**Optimistic UI Pattern:**

```tsx
// Example structure (not actual code):
const [optimisticState, addOptimistic] = useOptimistic(
  { isLiked, likeCount },
  (state, action) => {
    if (action === 'like') return { isLiked: true, likeCount: state.likeCount + 1 }
    if (action === 'unlike') return { isLiked: false, likeCount: Math.max(0, state.likeCount - 1) }
  }
)
```

**Toast Notification System:**

Use library like react-hot-toast or sonner for toast notifications, or implement custom toast component.

**Performance Considerations:**

- Like button should respond in < 50ms to feel instant
- Server action should complete in < 500ms
- Database queries should use indexes on foreign keys
- Batch fetch like states for current page, not all user likes

**Accessibility Checklist:**

- [ ]  Button has descriptive aria-label: "Like this post" / "Unlike this post"
- [ ]  State changes announced to screen readers
- [ ]  Button is keyboard accessible (Tab, Enter, Space)
- [ ]  Focus visible indicator on button
- [ ]  Color is not only indicator (icon shape changes too)

**Security Checklist:**

- [ ]  Server Actions verify authentication
- [ ]  postId validated before database operations
- [ ]  Database constraints prevent duplicate likes
- [ ]  No authorization needed for read operations (public likes)
- [ ]  Error messages don't expose sensitive information