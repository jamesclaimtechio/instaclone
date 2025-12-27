# Feature: Follow System (Module 9)

**Core Problem:** Enable users to build social connections by following other users, establishing the social graph foundation with optimistic UI for instant feedback.

**Total Chunks:** 3

**Total Estimated Duration:** 6-10 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Module 4 (User Profiles)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Follow Data Layer | 📊 Data | 2-3 hrs | Module 4 complete (user profiles displaying) |
| 2 | Follow Button UI with Optimistic Updates | 🎨 UI | 3-4 hrs | Chunk 1 complete (follow Server Actions working) |
| 3 | Follower Counts & State Persistence | ⚙️ Logic | 2-3 hrs | Chunk 2 complete (follow button interactive) |

---

# Chunk 1: 📊 Follow Data Layer

Duration: 2-3 hours | Prerequisites: Module 4 complete (user profiles displaying, user data available)

## Quick Reference

**Builds:** Database operations for creating and deleting follow relationships with proper authorization

**Connects:** Follows table → Server Actions for follow/unfollow → Profile queries with follower counts

**Pattern:** Drizzle ORM inserts/deletes with composite unique constraints, aggregate queries for counts

**Watch For:** Duplicate follow prevention, self-follow prevention, negative count issues, authorization gaps

## Context

### User Problem

Users need a backend system to establish and track social connections with other users, with reliable follower/following counts.

### From Module Brief

- **Follow Action:** Users can follow other users
- **Unfollow Action:** Users can unfollow users they previously followed
- **Follow State:** System remembers who follows whom
- **Follower Count:** Each profile shows total followers
- **Following Count:** Each profile shows total users they follow
- **Self-Follow Prevention:** Users cannot follow themselves
- **No Follow Lists:** MVP only shows counts, not lists of followers/following (per Master Spec)
- **No Feed Filtering:** Feed remains global, not filtered by follows (per Master Spec)

## What's Changing

### New Additions

- **followUser Server Action:** Accepts targetUserId, creates follow record, returns new counts
- **unfollowUser Server Action:** Accepts targetUserId, deletes follow record, returns new counts
- **getFollowStatus query function:** Checks if current user follows target user (returns boolean)
- **getFollowerCount query function:** Returns count of users following target user
- **getFollowingCount query function:** Returns count of users target user is following
- **getFollowCounts query function:** Returns both follower and following counts efficiently

### Modifications to Existing

- **getUserProfile query (Module 4):** Must include follower count, following count, and isFollowing status
- **Profile Page (Module 4):** Display follower and following counts

### No Changes To

- Post creation/display from Module 6
- Like functionality from Module 7
- Comment functionality from Module 8
- Feed queries remain global (no filtering by follows)

## Data Flow

### Follow Creation Flow

1. **Trigger:** User clicks "Follow" button on another user's profile
2. **Authentication Check:** Verify user is authenticated and session valid
3. **Validation:** Check targetUserId is valid UUID, user exists, not following self
4. **Server Action Call:** followUser(targetUserId) called
5. **Database Insert:** INSERT INTO follows (followerId, followingId, createdAt) VALUES (currentUserId, targetUserId, now())
6. **Unique Constraint:** Database enforces unique (followerId, followingId) - prevents duplicates
7. **Count Queries:**
    - SELECT COUNT(*) FROM follows WHERE followingId = targetUserId (follower count)
    - SELECT COUNT(*) FROM follows WHERE followerId = currentUserId (following count)
8. **Conditional Branches:**
    - If success → return { success: true, followerCount: X, followingCount: Y, isFollowing: true }
    - If duplicate constraint → return { success: true, ...counts, isFollowing: true } (idempotent)
    - If self-follow attempt → return error "Cannot follow yourself"
    - If user not found → return error "User not found"
    - If not authenticated → return error "Not authenticated"
    - If database error → return error "Failed to follow user"
9. **Final State:** Follow record exists, counts incremented

### Unfollow Flow

1. **Trigger:** User clicks "Following" button on profile they follow
2. **Authentication Check:** Verify user is authenticated
3. **Server Action Call:** unfollowUser(targetUserId) called
4. **Validation:** Check targetUserId is valid UUID
5. **Database Delete:** DELETE FROM follows WHERE followerId = currentUserId AND followingId = targetUserId
6. **Count Queries:** Get updated follower and following counts
7. **Conditional Branches:**
    - If success → return { success: true, followerCount: X, followingCount: Y, isFollowing: false }
    - If no rows affected → return { success: true, ...counts, isFollowing: false } (idempotent)
    - If not authenticated → return error "Not authenticated"
    - If database error → return error "Failed to unfollow user"
8. **Final State:** Follow record removed, counts decremented

### Follow Status Query Flow

1. **Trigger:** Profile page loads
2. **Query:** SELECT EXISTS(SELECT 1 FROM follows WHERE followerId = $1 AND followingId = $2)
3. **Result:** Boolean indicating if current user follows target user
4. **Count Query:** SELECT follower count and following count for target user
5. **Final State:** isFollowing boolean and counts ready for display

## Things to Watch For

**Self-Follow Prevention** → User tries to follow themselves → Prevention: Check targetUserId !== currentUserId before insert, return clear error

**Duplicate Follow Race Condition** → Two rapid clicks create duplicate follows → Prevention: Unique composite constraint on (followerId, followingId), handle gracefully

**Authentication Bypass** → Unauthenticated user sends follow request → Prevention: Check session exists at start of Server Action

**Negative Count Issues** → Unfollow when count is 0 → Prevention: Counts computed from database, never go negative naturally

**User Not Found** → Following non-existent user → Prevention: Foreign key constraint prevents, or check user exists before insert

**Foreign Key Violation** → Follow references deleted user → Prevention: Ensure foreign key constraints on followerId and followingId

**Missing Cascade Delete** → User deleted but follows remain → Prevention: Foreign keys with ON DELETE CASCADE on both followerId and followingId

**Count Query Performance** → Counting followers on every action is slow → Prevention: Use indexed COUNT queries, test with users with 10,000+ followers

**Stale Follow Counts** → Profile shows old count after follow → Prevention: Always query database for counts in real-time

**SQL Injection in UserId** → Malicious userId string breaks query → Prevention: Use parameterized queries with Drizzle, validate UUID format

**Invalid UUID Format** → userId is malformed UUID → Prevention: Validate UUID format before database operations

**Session Expiration Mid-Action** → User's session expires while clicking follow → Prevention: Check session validity in Server Action

**Double Unfollow** → User unfollows twice rapidly → Prevention: DELETE is idempotent, check rows affected but don't error if 0

**Count Consistency** → Follower count doesn't match following count across users → Prevention: Query counts from database each time, not cached

**Transaction Isolation Issues** → Concurrent follows might cause inconsistencies → Prevention: Use default READ COMMITTED isolation, COUNT accurate at execution time

**Follow Spam** → User follows/unfollows rapidly to spam → Prevention: No rate limiting in MVP, but backend is idempotent

**Authorization on Unfollow** → User tries to unfollow someone else's follow → Prevention: Unfollow only removes current user's follow (WHERE followerId = $currentUser)

**Boolean vs Count Return** → Inconsistent return types → Prevention: Standardize on { success, followerCount, followingCount, isFollowing }

**Database Connection Pool** → Many simultaneous follows exhaust connections → Prevention: Drizzle + Neon handle pooling

**Incorrect Join Type** → INNER JOIN instead of LEFT JOIN for counts → Prevention: Use straightforward COUNT queries, no joins needed

**Bidirectional Follows** → A follows B, B follows A creates issues → Prevention: This is normal and allowed, two separate records

**Count as NULL** → COUNT returns null instead of 0 → Prevention: Use COALESCE(COUNT(*), 0) or handle null

**Deleted User Edge Case** → User A follows User B, User B is deleted → Prevention: Foreign key cascade deletes follow record

**Audit Trail Missing** → No record of when follows happened → Prevention: createdAt timestamp provides basic audit

**Index Missing on Foreign Keys** → Queries slow due to unindexed keys → Prevention: Ensure indexes on follows.followerId and follows.followingId

**Timezone Issues** → Follows timestamped inconsistently → Prevention: Store all timestamps in UTC

**Follow vs Following Confusion** → Mixing up follower and following logic → Prevention: Clear naming: follower = person who follows, following = person being followed

**Memory Leak with Large Result Sets** → Fetching 10,000 followers → Prevention: MVP only queries counts, not lists

**Profile Query Missing Counts** → Profile displays without counts → Prevention: Include counts in getUserProfile query

**Error Message Leakage** → Database constraint errors expose schema → Prevention: Catch constraint violations, return generic success (idempotent)

**Multiple Follow Queries** → Separate queries for each count → Prevention: Query both counts in single query with two COUNT subqueries

**Optimistic Lock Failure** → Two users follow at same moment → Prevention: No locking needed, each gets their own follow record

## Testing Verification

### Existing Features Still Work

- [ ]  User profiles display correctly
- [ ]  Post creation still works
- [ ]  Feed still displays posts
- [ ]  Authentication still works

### New Functionality Works

- [ ]  followUser Server Action successfully inserts follow record
- [ ]  unfollowUser Server Action successfully deletes follow record
- [ ]  Follower count increases when someone follows
- [ ]  Following count increases when user follows someone
- [ ]  Follower count decreases when someone unfollows
- [ ]  Following count decreases when user unfollows
- [ ]  getFollowStatus returns true for followed users
- [ ]  getFollowStatus returns false for unfollowed users
- [ ]  getUserProfile includes follower and following counts
- [ ]  getUserProfile includes isFollowing status

### Edge Cases

- [ ]  Following same user twice returns success (idempotent)
- [ ]  Unfollowing non-followed user returns success (idempotent)
- [ ]  Self-follow attempt returns error
- [ ]  Following deleted user returns error
- [ ]  Unauthenticated follow request returns error
- [ ]  Invalid user UUID returns error
- [ ]  Multiple users can follow same user, counts increment correctly
- [ ]  Follower count never goes negative
- [ ]  Following count never goes negative
- [ ]  Deleting user cascades to delete their follow records
- [ ]  User with 1000 followers shows correct count
- [ ]  A follows B, B follows A creates two separate records (bidirectional follows allowed)

---

# Chunk 2: 🎨 Follow Button UI with Optimistic Updates

Duration: 3-4 hours | Prerequisites: Chunk 1 complete (followUser/unfollowUser Server Actions working, counts querying correctly)

## Quick Reference

**Builds:** Interactive follow button with optimistic UI using React's useOptimistic for instant feedback

**Connects:** Follow button component → Server Actions (follow/unfollow) → Optimistic state → Count updates

**Pattern:** React Client Component with useOptimistic, toggle button state, count display

**Watch For:** Optimistic rollback failures, button state confusion, self-follow button visibility, count sync

## Context

### User Problem

Users expect instant feedback when following/unfollowing without waiting for server confirmation, with clear button states and updated counts.

### From Module Brief

- **Button States:** "Follow" for unfollowed users, "Following" for followed users
- **Toggle Behavior:** Click to follow, click again to unfollow
- **Optimistic UI:** Use React's useOptimistic for immediate updates before server confirmation
- **Count Display:** Show follower and following counts on profile
- **Real-Time Updates:** Button state and counts update immediately
- **Error Handling:** Rollback optimistic update if server fails, show toast notification
- **Visual Feedback:** Button text changes, counts increment/decrement
- **Self-Follow Hidden:** No follow button on own profile

## What's Changing

### New Additions

- **FollowButton Component:** Client component with button, current follow state
- **Optimistic State Hook:** Uses useOptimistic to manage local follow state before server confirmation
- **Follow Action Handler:** Async function that updates optimistic state, calls Server Action
- **Button Styling:** Different styles for "Follow" vs "Following" states
- **Toast Notification System:** For error messages when follow/unfollow fails
- **Double-Click Prevention:** Using isPending from useTransition

### Modifications to Existing

- **Profile Page (Module 4):** Add FollowButton component (only for other users' profiles)
- **Profile Header (Module 4):** Display follower and following counts
- **Own Profile Check:** Verify follow button doesn't show on own profile

### No Changes To

- Server Actions from Chunk 1 (backend logic remains same)
- Profile posts grid from Module 4
- Post/like/comment functionality

## Data Flow

### Optimistic Follow Flow

1. **Trigger:** User clicks "Follow" button
2. **Optimistic Update:** useOptimistic immediately sets isFollowing to true, increments both counts by 1
3. **UI Update:** Button changes to "Following", counts show new numbers
4. **Server Action Call:** Call followUser(targetUserId) in background
5. **Server Response:** Wait for Server Action to complete
6. **Conditional Branches:**
    - If success → Keep optimistic state, mark as confirmed
    - If error → Rollback (button back to "Follow", counts decrement), show toast "Action failed. Try again."
7. **Final State:** UI matches server state

### Optimistic Unfollow Flow

1. **Trigger:** User clicks "Following" button
2. **Optimistic Update:** useOptimistic immediately sets isFollowing to false, decrements both counts by 1
3. **UI Update:** Button changes to "Follow", counts show new numbers
4. **Server Action Call:** Call unfollowUser(targetUserId) in background
5. **Server Response:** Wait for Server Action to complete
6. **Conditional Branches:**
    - If success → Keep optimistic state, mark as confirmed
    - If error → Rollback (button back to "Following", counts increment), show toast "Action failed. Try again."
7. **Final State:** UI matches server state

## UX Specification

### User Flow

- Trigger: Visit another user's profile page
- Step 1: See "Follow" button below username
- Step 2: Click "Follow" button
- Step 3: Button immediately changes to "Following"
- Step 4: Follower count (theirs) and following count (yours) increment
- Step 5a (success): State persists
- Step 5b (failure): Button reverts to "Follow", counts revert, error toast appears

### Empty States

- Own profile: No follow button visible
- User with 0 followers: Shows "0 followers"

### Loading States

- During action: Button disabled or shows spinner (optional)
- Optimistic UI provides instant feedback, no explicit loading state needed

### Error States

- Server action fails: Toast notification "Action failed. Try again."
- Network timeout: Same toast notification
- Authentication error: Toast "Please log in to follow users"
- Self-follow attempt: No button shown (prevented in UI)

### Responsive Behavior

- Mobile: Button full width or prominent placement, counts readable
- Desktop: Button natural width, hover state with pointer cursor
- All sizes: Button and counts always visible, not cut off

## Things to Watch For

**Self-Follow Button Visible** → Follow button shows on own profile → Prevention: Check currentUserId !== profileUserId, don't render button if match

**Double-Click Race Condition** → User clicks button twice rapidly → Prevention: Disable button during request using isPending from useTransition

**Button State Confusion** → "Following" text unclear if it's action or status → Prevention: Consider "Unfollow" text on hover or clear styling difference

**Optimistic Rollback Glitch** → Button flickers when rolling back → Prevention: Use smooth CSS transitions

**Count Goes Negative** → Optimistic decrement when count is 0 → Prevention: Use Math.max(0, count - 1) in optimistic update

**Server Error Not Caught** → Error doesn't trigger rollback → Prevention: Wrap Server Action call in try-catch

**Toast Notification Spam** → Multiple errors show multiple toasts → Prevention: Debounce toast notifications

**Counts Not Updating** → Button changes but counts stay same → Prevention: Update both isFollowing and counts in optimistic state

**Wrong Count Updated** → Only follower count updates, not following → Prevention: Update both counts (follower for target user, following for current user)

**Accessibility Missing** → Screen readers don't announce follow action → Prevention: Add ARIA label, announce state changes

**Keyboard Access** → Can't follow with keyboard → Prevention: Button is keyboard accessible by default

**Focus State Missing** → No visible focus indicator → Prevention: Style :focus-visible state on button

**Touch Feedback Missing** → No visual feedback on mobile tap → Prevention: Add :active state styling

**Button Text Too Long** → "Following" text wraps on mobile → Prevention: Use consistent button width or shorter text

**Count Formatting** → "1 followers" instead of "1 follower" → Prevention: Conditional text: count === 1 ? "1 follower" : `${count} followers`

**Multiple Profiles Share State** → Following one user affects another profile → Prevention: Each FollowButton manages state with unique userId

**Hydration Mismatch** → Server renders different state than client → Prevention: Pass initial follow state from server

**React 19 Not Available** → useOptimistic doesn't exist → Prevention: Verify React 19, or implement manual optimistic pattern

**Button Type Not Set** → Button submits form if inside form → Prevention: Set type="button"

**Network Timeout Not Handled** → Request hangs forever → Prevention: Set timeout on Server Action call

**Success Feedback Excessive** → Toast for every follow is annoying → Prevention: No success toast, optimistic UI is sufficient

**Button Styling Inconsistent** → Doesn't match app design → Prevention: Apply consistent styling matching other buttons

**Follow/Unfollow Text Ambiguous** → User doesn't understand button → Prevention: Clear text: "Follow" vs "Following", consider icon

**Counts Position Confusing** → Unclear which count is which → Prevention: Label clearly: "X followers", "Y following"

**Bidirectional Follow Confusion** → A follows B, B follows A, counts confusing → Prevention: Each user's counts are independent and correct

**Profile Header Layout Shift** → Counts changing shifts layout → Prevention: Use fixed width or stable layout for count containers

**Button Disabled State Not Clear** → User doesn't know button is disabled → Prevention: Reduce opacity, add cursor: not-allowed

**Optimistic State Persists After Error** → Rollback doesn't happen → Prevention: useOptimistic automatically rolls back, verify in testing

**Server State Overrides Optimistic** → Server response causes flash → Prevention: Merge states carefully

**Button in Wrong Location** → Button not visible or poorly positioned → Prevention: Place prominently in profile header

**Icon Missing** → Text-only button less intuitive → Prevention: Consider adding user icon or plus/checkmark icons

## Testing Verification

### Existing Features Still Work

- [ ]  Profile page still displays correctly
- [ ]  Profile posts grid still works
- [ ]  Navigation still works

### New Functionality Works

- [ ]  Follow button appears on other users' profiles
- [ ]  Follow button does NOT appear on own profile
- [ ]  "Follow" button shows for unfollowed users
- [ ]  "Following" button shows for followed users
- [ ]  Clicking "Follow" changes button immediately
- [ ]  Follower count increments immediately
- [ ]  Following count increments immediately
- [ ]  Clicking "Following" changes button immediately
- [ ]  Follower count decrements immediately
- [ ]  Following count decrements immediately
- [ ]  Server action completes in background
- [ ]  State persists after successful action
- [ ]  Page reload shows correct follow state

### Edge Cases

- [ ]  Double-clicking button doesn't cause issues (button disabled)
- [ ]  Server error shows toast notification
- [ ]  Server error rolls back optimistic update
- [ ]  Following user with 0 followers shows "1 follower" not "1 followers"
- [ ]  Unfollowing user with 1 follower shows "0 followers"
- [ ]  Multiple profiles each have independent button state
- [ ]  Rapid follow/unfollow works correctly
- [ ]  Network timeout shows error and rolls back
- [ ]  Keyboard users can follow/unfollow with Enter
- [ ]  Screen reader announces follow action
- [ ]  Mobile tap has visual feedback

---

# Chunk 3: ⚙️ Follower Counts & State Persistence

Duration: 2-3 hours | Prerequisites: Chunk 2 complete (follow button interactive, optimistic updates working)

## Quick Reference

**Builds:** Robust follow state management across navigation with consistent counts displayed everywhere

**Connects:** Follow state → Navigation events → Profile views → Count displays

**Pattern:** Server-side counts as source of truth, client-side optimistic updates with reconciliation

**Watch For:** Stale counts after navigation, count inconsistencies, unhandled error scenarios

## Context

### User Problem

Users expect their follow relationships to persist correctly across navigation, page reloads, and different profile views with accurate counts.

### From Module Brief

- **State Persistence:** Following relationships persist after page reload
- **Cross-Profile Consistency:** Following user A shows as followed on their profile consistently
- **Count Accuracy:** Follower and following counts are accurate across all views
- **No Follower Lists:** MVP only shows counts, not clickable lists (per Master Spec)
- **Global Feed Unchanged:** Feed remains global, not filtered by follows (per Master Spec)

## What's Changing

### New Additions

- **Count Display Component:** Reusable component showing follower/following counts
- **State Reconciliation Logic:** Ensure optimistic state reconciles with server on page load
- **Error Recovery:** Retry mechanism for failed follow actions
- **Count Formatting Utility:** Consistent number formatting (e.g., 1.2K for 1200)

### Modifications to Existing

- **Profile Query:** Ensure counts always fresh on page load
- **Feed Post Cards (Optional):** Could show author follower count (optional enhancement)

### No Changes To

- Server Actions from Chunk 1 (backend unchanged)
- Follow button UI from Chunk 2 (visual design same)
- Feed queries remain global

## Data Flow

### Page Load State Reconciliation

1. **Trigger:** User navigates to profile page
2. **Server Query:** Fetch user profile with follower count, following count, isFollowing status
3. **Initial Render:** Render profile with server state
4. **Client Hydration:** Follow button becomes interactive with correct initial state
5. **No Optimistic Conflict:** State matches server
6. **Final State:** Counts and button show correct state from server

### Navigation State Preservation

1. **Trigger:** User follows User A, then navigates to User B's profile
2. **Client Navigation:** Next.js client-side navigation
3. **Query Execution:** getUserProfile fetches User B with current counts from database
4. **State Display:** User B's profile shows correct counts and follow state
5. **Return to User A:** User A still shows as followed (state persisted in database)
6. **Final State:** Consistent follow states across all profiles

### Count Update Across Views

1. **Trigger:** User A follows User B
2. **Database Update:** Follow record created
3. **User B's Follower Count:** Increments by 1 (User B's profile shows this)
4. **User A's Following Count:** Increments by 1 (User A's own profile shows this)
5. **Consistency:** Both counts accurate and independent
6. **Final State:** All counts reflect current database state

## Things to Watch For

**Stale Counts After Back Button** → User follows, navigates away, presses back, counts stale → Prevention: Next.js refreshes data on back navigation

**Inconsistent Counts Between Views** → Profile shows 100 followers, other view shows 99 → Prevention: All views query database in real-time

**Optimistic State Survives Reload** → User follows, closes tab before confirmation, reopens, shows following → Prevention: Optimistic state only in memory, reload fetches from server

**Count Drift Over Time** → Small inconsistencies accumulate → Prevention: Always fetch counts from database, never cache

**Follower/Following Confusion** → Mixing up which count is which → Prevention: Clear labels: "X followers" (people following this user), "Y following" (people this user follows)

**Large Number Formatting** → 10000 displayed as "10000" is hard to read → Prevention: Format as "10K" or "10,000" for readability

**Count Display Inconsistent** → Sometimes shows count, sometimes doesn't → Prevention: Always display counts, use "0 followers" for users with none

**Cache Invalidation Missing** → Next.js cache serves stale counts → Prevention: Use revalidatePath or revalidateTag after follow/unfollow

**Hydration State Mismatch** → Server says following, client says not following → Prevention: Don't use localStorage for follow state, use server state

**Negative Count in UI** → Display shows "-1 followers" → Prevention: Use Math.max(0, count) in display logic

**Count Formatting Inconsistency** → Sometimes "100 followers", sometimes "100" → Prevention: Use consistent formatting helper

**Following Count Missing** → Profile shows follower count but not following count → Prevention: Display both counts prominently

**No Visual Hierarchy** → Counts blend with other text → Prevention: Style counts distinctly, make them prominent

**Counts Not Clickable** → Users try to click counts expecting list → Prevention: Make non-clickable clear (no hover effect), or add tooltip explaining lists not available in MVP

**Profile Without Counts** → Some profiles missing count display → Prevention: Ensure all profile views include counts query and display

**Own Profile Count Confusion** → User confused about their own counts → Prevention: Same display on own profile and others' profiles

**Bidirectional Follow Display** → A follows B, B follows A, no indication → Prevention: This is normal, each profile shows their own counts correctly

**Count Revalidation Missing** → Next.js doesn't refetch counts on focus → Prevention: Configure for revalidation or accept stale until navigation

**Race Between Multiple Tabs** → Follow in one tab, stale in another → Prevention: Each tab operates independently, reload shows correct state

**Error After 3 Retries** → Multiple failed attempts, no guidance → Prevention: After 3 fails, suggest checking connection

**Success Feedback Missing** → User doesn't know if follow persisted → Prevention: Optimistic UI is feedback, counts update confirms success

**Count Display Layout Shift** → Changing from "99 followers" to "100 followers" shifts layout → Prevention: Use monospace font for numbers or stable container width

**Follower Milestone Not Celebrated** → No feedback for reaching 100 followers → Prevention: Out of scope for MVP, but could add confetti effect

**Follow Spam Detection** → User follows 1000 people rapidly → Prevention: No rate limiting in MVP, backend handles load

**Database Read After Write** → Follow created but count query reads stale → Prevention: Query count immediately after insert

**Profile Page Missing Counts** → Developer forgets to include counts → Prevention: Include in profile query, add to TypeScript types

**Count Fetch Error** → Database error loading counts → Prevention: Handle gracefully, show "--" or "Error loading"

**localStorage Sync Attempt** → Trying to cache counts locally → Prevention: Not required, online-only acceptable

**Count Display Size** → Too small or too large → Prevention: Use readable font size, test on all screen sizes

**Follow Button and Counts Separated** → Button far from counts is confusing → Prevention: Place button and counts near each other in profile header

**Counts Not Labeled** → Just "100 | 50" without context → Prevention: Always include labels "followers" and "following"

**Count Update Animation** → Counts change without transition → Prevention: Add subtle count-up animation for polish (optional)

## Testing Verification

### Existing Features Still Work

- [ ]  Profile pages load correctly
- [ ]  Follow button works as expected from Chunk 2
- [ ]  Navigation works smoothly

### New Functionality Works

- [ ]  Follow user, refresh page, still shows as following
- [ ]  Follow user, navigate to another profile, navigate back, still following
- [ ]  Follower count displays correctly on all profiles
- [ ]  Following count displays correctly on all profiles
- [ ]  Own profile shows own follower and following counts
- [ ]  Counts labeled clearly ("X followers", "Y following")
- [ ]  Failed follow shows error toast
- [ ]  Large numbers formatted readably (e.g., "1.2K")

### Edge Cases

- [ ]  Follow user, close browser, reopen, still shows as following
- [ ]  Follow user, log out, log back in, still shows as following
- [ ]  User with 0 followers shows "0 followers" not blank
- [ ]  User with 1 follower shows "1 follower" (singular)
- [ ]  User with 10,000 followers shows formatted count
- [ ]  Multiple profiles show independent, accurate counts
- [ ]  Rapid navigation between profiles shows correct counts
- [ ]  Following deleted user handled gracefully
- [ ]  Network disconnect during follow recovers gracefully
- [ ]  Counts never show negative numbers

---

## Feature Acceptance Tests

**Run these after all 3 chunks are complete to verify the full Module 9 feature works:**

### Core Tests (from Module Brief)

- [ ]  View another user's profile → "Follow" button visible
- [ ]  Click "Follow" → Button changes to "Following", follower count increments
- [ ]  Refresh page → Button still shows "Following"
- [ ]  Click "Following" → Button changes to "Follow", follower count decrements
- [ ]  View own profile → No "Follow" button visible

### Edge Cases (from Module Brief)

- [ ]  Rapidly click "Follow" button 5 times → Final state is consistent
- [ ]  Follow user with 0 followers → Count becomes 1
- [ ]  Unfollow when count is 1 → Count becomes 0 (not negative)
- [ ]  User A follows User B → User B's follower count increases, User A's following count increases
- [ ]  User A unfollows User B → Both counts decrease correctly

### Integration Tests (from Module Brief)

- [ ]  Follow user → their follower count updates → your following count updates → both persist
- [ ]  Delete user with 50 followers → All 50 follow records deleted (cascade)
- [ ]  User A follows User B → User B follows User A → Both show as "Following" each other (bidirectional)
- [ ]  Follow/unfollow does not affect feed display (feed remains global)
- [ ]  Navigate between profiles → Follow
