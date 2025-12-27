# Feature: Admin Dashboard (Module 11)

**Core Problem:** Provide administrative tools for content moderation and user management to maintain platform quality and handle abuse.

**Total Chunks:** 3

**Total Estimated Duration:** 10-14 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Modules 2 (Auth), 6 (Posts), 8 (Comments)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Admin Authorization & Dashboard Layout | ⚙️ Logic | 3-4 hrs | Module 2 complete (auth system with isAdmin flag) |
| 2 | User Management & Content Lists | 🎨 UI | 4-5 hrs | Chunk 1 complete (admin access working) |
| 3 | Moderation Actions & Deletion | ⚙️ Logic | 3-4 hrs | Chunk 2 complete (lists displaying) |

---

# Chunk 1: ⚙️ Admin Authorization & Dashboard Layout

Duration: 3-4 hours | Prerequisites: Module 2 complete (users table has isAdmin field, auth middleware working)

## Quick Reference

**Builds:** Admin-only route protection and dashboard container with navigation

**Connects:** Middleware → isAdmin check → Admin routes → Dashboard layout

**Pattern:** Next.js middleware with role checking, protected routes, admin layout wrapper

**Watch For:** Authorization bypass, client-side role checks only, privilege escalation, missing middleware protection

## Context

### User Problem

Admins need secure access to moderation tools without risk of unauthorized users accessing admin functions.

### From Module Brief

- **Admin Flag:** isAdmin boolean on users table
- **Route Protection:** /admin routes only accessible to admins
- **Middleware Check:** Server-side authorization, not just UI hiding
- **Access Denied:** Clear error for non-admins attempting access
- **Dashboard Layout:** Container for all admin features
- **Navigation:** Links to Users, Posts, Comments sections
- **Basic Stats:** Display total users, posts, comments counts

## What's Changing

### New Additions

- **Admin Middleware:** Check isAdmin flag, redirect non-admins
- **Admin Dashboard Route:** /admin page as container
- **Admin Layout Component:** Wrapper with navigation and stats
- **getAdminStats query:** Fetch counts for users, posts, comments
- **Admin Navigation:** Links to different admin sections
- **Access Denied Page:** Error page for unauthorized access

### Modifications to Existing

- **Middleware:** Add admin route checking to existing auth middleware
- **User Schema:** Verify isAdmin field exists (should be from Module 2)

### No Changes To

- User-facing features
- Post/comment/like functionality
- Regular user authentication

## Data Flow

### Admin Access Flow

1. **Trigger:** User navigates to /admin URL
2. **Middleware Check:** Extract user from session/JWT
3. **Authentication:** Verify user is logged in
4. **Authorization:** Check user.isAdmin === true
5. **Conditional Branches:**
    - If admin → Allow access, render admin dashboard
    - If not admin → Redirect to home with error "Access denied"
    - If not authenticated → Redirect to login
6. **Dashboard Load:** Fetch basic stats (user, post, comment counts)
7. **Final State:** Admin sees dashboard with navigation and stats

## Things to Watch For

**Client-Only Authorization** → isAdmin checked in UI but not backend → Prevention: Always verify isAdmin in middleware and Server Actions, never trust client

**Authorization Bypass** → Direct API calls bypass middleware → Prevention: Check isAdmin in every admin Server Action, not just routes

**Privilege Escalation** → Non-admin sets isAdmin=true in client → Prevention: isAdmin only settable by other admins or during user creation (seed data)

**JWT Tampering** → User modifies JWT to set isAdmin=true → Prevention: JWT signature verification catches tampering

**Session Hijacking** → Attacker steals admin session → Prevention: Use secure, HTTP-only cookies, short session expiry

**Missing Middleware Protection** → Some admin routes not protected → Prevention: Apply middleware to all /admin/* routes

**Hardcoded Admin Check** → Checking specific user ID instead of isAdmin flag → Prevention: Use isAdmin flag, not user IDs

**Admin Flag Not Set** → No way to make first admin user → Prevention: Seed script or manual database update to set first admin

**Multiple Admin Levels** → Need for super-admin vs regular admin → Prevention: Out of scope for MVP, single isAdmin flag sufficient

**Admin Activity Logging** → No audit trail of admin actions → Prevention: Optional enhancement, log admin actions server-side

**Middleware Order Wrong** → Admin check before auth check → Prevention: First verify authenticated, then verify admin

**Redirect Loop** → Admin denied page redirects back to admin → Prevention: Redirect to home or show static error page

**Error Message Leakage** → Detailed error exposes system info → Prevention: Generic "Access denied" message, log details server-side

**Stats Query Performance** → Counting all users/posts/comments is slow → Prevention: Use COUNT queries with indexes, acceptable for MVP

**Stats Not Real-Time** → Cached stats show stale data → Prevention: Query database on each dashboard load for fresh counts

**Admin Dashboard Publicly Listed** → Search engines index /admin → Prevention: Add noindex meta tag, block in robots.txt

**No Rate Limiting** → Admin brute force attempts → Prevention: Out of scope for MVP, but consider for production

**Timezone Issues** → Stats displayed in wrong timezone → Prevention: Store UTC, convert to admin's timezone if needed

**Layout Breaking** → Admin nav breaks on mobile → Prevention: Responsive admin layout, test on all screen sizes

**Stats Display Format** → Large numbers unreadable → Prevention: Format with commas: "1,234" or "1.2K"

**Navigation Links Not Working** → Links to Users/Posts sections 404 → Prevention: Implement routes in Chunks 2-3, or show coming soon

**Admin User Deleted** → Admin deletes own account, loses access → Prevention: Warn before allowing, or prevent self-deletion

**isAdmin Not Indexed** → Slow query for admin users → Prevention: Add index on isAdmin if querying frequently

**Middleware Not Applied** → Forgot to add middleware to admin routes → Prevention: Configure middleware in next.config.js or middleware.ts

**TypeScript Errors** → isAdmin not in user type → Prevention: Update user type to include isAdmin: boolean

**Admin UI Not Distinct** → Looks like regular pages → Prevention: Style admin pages distinctly, add "Admin" header

**Breadcrumbs Missing** → User lost in admin section → Prevention: Add breadcrumbs or clear page titles

**Back Button Confusion** → Back button goes to user pages → Prevention: Admin nav should be self-contained

**Admin Role Revoked** → Admin made non-admin while using dashboard → Prevention: Check isAdmin on each request, not just initial load

**Console Logs Exposed** → Debugging logs show sensitive data → Prevention: Remove debug logs before production

**Error Boundaries Missing** → Admin error crashes entire app → Prevention: Add error boundary around admin routes

## Testing Verification

### Existing Features Still Work

- [ ]  Regular users can still access app normally
- [ ]  Authentication still works for all users
- [ ]  Non-admin features unaffected

### New Functionality Works

- [ ]  Admin user can access /admin route
- [ ]  Non-admin user redirected from /admin
- [ ]  Unauthenticated user redirected to login
- [ ]  Admin dashboard displays stats (user, post, comment counts)
- [ ]  Admin navigation shows links to Users, Posts, Comments
- [ ]  Middleware protects all /admin routes
- [ ]  isAdmin flag checked in middleware

### Edge Cases

- [ ]  Non-admin tries /admin → Shows "Access denied"
- [ ]  Admin logs out → /admin redirects to login
- [ ]  Admin navigates to non-existent admin page → 404
- [ ]  Stats show correct counts (verify manually)
- [ ]  Admin can navigate between admin sections
- [ ]  Back button from admin works correctly
- [ ]  Admin on mobile sees responsive layout

---

# Chunk 2: 🎨 User Management & Content Lists

Duration: 4-5 hours | Prerequisites: Chunk 1 complete (admin dashboard accessible, middleware protecting routes)

## Quick Reference

**Builds:** Admin lists displaying all users, posts, and comments with pagination and basic info

**Connects:** Admin dashboard → List pages → Database queries → Paginated displays

**Pattern:** Server Component tables with pagination, filtering, sorting

**Watch For:** Performance with large datasets, pagination bugs, missing data, sensitive info exposure

## Context

### User Problem

Admins need to view and browse all users, posts, and comments to identify problematic content or users.

### From Module Brief

- **Users List:** All users with profile pics, usernames, emails, join dates
- **Posts List:** All posts in chronological order with author, image thumbnail, caption snippet
- **Comments List:** All comments with post context, author, text preview
- **Pagination:** Handle large datasets, 20-50 items per page
- **Basic Info:** Display enough info to identify content without overwhelming
- **Links:** Click to view full profile/post/comment
- **No Search/Filter Required:** MVP shows all items, search out of scope

## What's Changing

### New Additions

- **Admin Users Page:** /admin/users route displaying user list
- **Admin Posts Page:** /admin/posts route displaying post list
- **Admin Comments Page:** /admin/comments route displaying comment list
- **User Table Component:** Displays user data in table format
- **Post Table Component:** Displays post data with thumbnails
- **Comment Table Component:** Displays comment data with context
- **Pagination Component:** Reusable pagination for all lists
- **getAllUsers query:** Fetch users with pagination
- **getAllPosts query:** Fetch posts with author and counts
- **getAllComments query:** Fetch comments with post and author info

### Modifications to Existing

- **Admin Dashboard:** Update navigation links to route to these pages

### No Changes To

- Deletion actions (Chunk 3)
- User-facing app
- Database schema

## Data Flow

### Users List Load Flow

1. **Trigger:** Admin navigates to /admin/users
2. **Authorization:** Middleware verifies admin access
3. **Query:** getAllUsers(page, limit=50) fetches users
4. **Data Processing:** Include id, username, email, profilePictureUrl, createdAt, isAdmin
5. **Render:** Display users in table with pagination
6. **Pagination:** Page links for next/previous pages
7. **Final State:** Admin sees list of all users

### Posts List Load Flow

1. **Trigger:** Admin navigates to /admin/posts
2. **Query:** getAllPosts(page, limit=50) with author, like count, comment count
3. **Display:** Show thumbnail, author username, caption preview, counts, date
4. **Links:** Click thumbnail or ID to view full post
5. **Final State:** Admin sees list of all posts

### Comments List Load Flow

1. **Trigger:** Admin navigates to /admin/comments
2. **Query:** getAllComments(page, limit=50) with author and post context
3. **Display:** Show comment text preview, author, post link, date
4. **Final State:** Admin sees list of all comments

## UX Specification

### User Flow

- Trigger: Click "Users" in admin navigation
- Step 1: See table of all users
- Step 2: Browse users, see profile pics, usernames, emails
- Step 3: Click username to view profile
- Step 4: Use pagination to see more users
- Same pattern for Posts and Comments sections

### Empty States

- No users: "No users registered yet" (unlikely)
- No posts: "No posts created yet"
- No comments: "No comments posted yet"

### Loading States

- Page load: Skeleton table rows or loading spinner
- Pagination: Brief loading indicator

### Error States

- Query failed: "Failed to load [users/posts/comments]. Please refresh."
- Database error: Generic error message, log details

### Responsive Behavior

- Desktop: Full table with all columns
- Tablet: Reduce columns, keep essential info
- Mobile: Card layout instead of table, stacked info

## Things to Watch For

**N+1 Query Problem** → Fetching author for each post separately → Prevention: Use JOIN to get all data in single query

**Performance with Large Datasets** → 100,000 users loads slowly → Prevention: Implement pagination, limit results per page

**Missing Pagination** → Trying to load all records at once → Prevention: Always use LIMIT and OFFSET in queries

**Pagination Math Wrong** → Page 2 shows same items as page 1 → Prevention: OFFSET = (page - 1) * limit

**Sensitive Data Exposure** → Showing password hashes or tokens → Prevention: Don't select sensitive fields, only safe display data

**Email Privacy Concern** → Displaying emails to admin is acceptable → Prevention: Admins need emails for user management, but add note about privacy

**Profile Picture Broken** → Missing images break layout → Prevention: Default avatar for null profilePictureUrl

**Caption Too Long** → Full caption breaks table layout → Prevention: Truncate to 100 chars with "..." and link to full post

**Comment Text Too Long** → Full comment breaks layout → Prevention: Truncate to 50-100 chars with "..."

**Timezone Display** → Dates shown in UTC confusing → Prevention: Format dates in admin's local timezone or clear UTC label

**No Total Count** → Admin doesn't know how many pages → Prevention: Query total count, display "Page X of Y"

**Pagination Links Broken** → Next/Previous buttons don't work → Prevention: Test pagination navigation thoroughly

**Table Not Sortable** → Can't sort by date or name → Prevention: Out of scope for MVP, add if time permits

**No Filtering** → Can't search for specific user → Prevention: Out of scope per "optional" in brief

**Table Overflow** → Table wider than viewport → Prevention: Make table scrollable horizontally or use responsive design

**Loading State Missing** → No indication of data loading → Prevention: Show skeleton or spinner during initial load

**isAdmin Column** → Showing isAdmin status for users → Prevention: Include in users list, useful for admin management

**Action Buttons Premature** → Delete buttons present but not functional → Prevention: Add in Chunk 3, or hide until implemented

**Link Targets Wrong** → Clicking user goes to wrong profile → Prevention: Use correct user ID in links, test navigation

**Image Thumbnails Large** → Post images too big in table → Prevention: Use thumbnail URLs, set max dimensions (50x50px)

**Table Accessibility** → Screen readers can't parse table → Prevention: Use semantic table tags, proper headers

**Mobile Table Broken** → Table unreadable on mobile → Prevention: Use card layout on mobile instead of table

**Empty Values** → Null/undefined displayed as text → Prevention: Handle nulls gracefully, show "-" or "N/A"

**Date Format Inconsistent** → Some absolute, some relative → Prevention: Use consistent format, e.g., "Dec 27, 2025 2:30 PM"

**Page State Lost** → Refreshing page goes back to page 1 → Prevention: Use URL query params for page number

**No Breadcrumbs** → Lost in admin sections → Prevention: Add breadcrumbs: Admin > Users

**Stats Not Updated** → Dashboard stats don't match lists → Prevention: Both query database, should match; check if caching issue

**Delete Cascade Warning** → No indication what happens if user deleted → Prevention: Handle in Chunk 3 with warnings

**Admin Activity** → Can't see recently active users → Prevention: Out of scope, but could add "Last Active" column

**Verified Status** → Can't see which users verified email → Prevention: Could add emailVerified column to users table

**Post Privacy** → Showing all posts even if private → Prevention: MVP has all public posts, no privacy settings

**Comment Context Missing** → Hard to tell which post comment belongs to → Prevention: Include post ID or link to post in comments list

**Keyboard Navigation** → Can't navigate table with keyboard → Prevention: Ensure links are keyboard accessible

**Copy User Data** → Admin wants to copy email address → Prevention: Plain text in table allows copy/paste naturally

## Testing Verification

### Existing Features Still Work

- [ ]  Admin dashboard still loads
- [ ]  Admin navigation still works
- [ ]  Non-admin still blocked from /admin

### New Functionality Works

- [ ]  /admin/users displays all users
- [ ]  Users table shows username, email, profile pic, join date
- [ ]  /admin/posts displays all posts
- [ ]  Posts table shows thumbnail, author, caption, counts
- [ ]  /admin/comments displays all comments
- [ ]  Comments table shows text preview, author, post context
- [ ]  Pagination works on all lists
- [ ]  Page numbers displayed correctly
- [ ]  Clicking Next/Previous page works

### Edge Cases

- [ ]  Empty users list shows appropriate message
- [ ]  List with 1000+ items paginates correctly
- [ ]  Clicking username navigates to correct profile
- [ ]  Missing profile pictures show default avatar
- [ ]  Long captions truncated correctly
- [ ]  Mobile view uses card layout, readable
- [ ]  Page refresh maintains current page number
- [ ]  Total page count displayed correctly

---

# Chunk 3: ⚙️ Moderation Actions & Deletion

Duration: 3-4 hours | Prerequisites: Chunk 2 complete (lists displaying, admin can browse content)

## Quick Reference

**Builds:** Delete functionality for users, posts, and comments with confirmation and cascade handling

**Connects:** Delete buttons → Confirmation dialogs → Admin delete Server Actions → Cascade deletions → List updates

**Pattern:** Server Actions with authorization, confirmation modals, optimistic UI updates

**Watch For:** Cascade failures, confirmation bypasses, authorization gaps, orphaned data

## Context

### User Problem

Admins need ability to remove problematic users, posts, or comments to maintain platform quality and handle abuse.

### From Module Brief

- **Delete Users:** Remove user and ALL their content (cascade)
- **Delete Posts:** Remove post with likes and comments (cascade from Module 6)
- **Delete Comments:** Remove individual comments
- **Confirmation Required:** All deletions show confirmation dialog
- **Permanent:** No soft delete, all deletions permanent
- **Cascade Info:** Show what will be deleted (e.g., "User and all 23 posts")
- **Activity Log:** NOT required per Master Spec ("optional")

## What's Changing

### New Additions

- **adminDeleteUser Server Action:** Delete user with cascade to all content
- **adminDeletePost Server Action:** Delete post with cascade to likes/comments
- **adminDeleteComment Server Action:** Delete individual comment
- **Delete Confirmation Modal:** Reusable modal for all delete actions
- **Delete Buttons:** On each list item, only visible to admins
- **Cascade Info Display:** Show impact of deletion before confirming
- **Success Feedback:** Toast notification on successful deletion

### Modifications to Existing

- **Users Table:** Add delete button column
- **Posts Table:** Add delete button column
- **Comments Table:** Add delete button column
- **Database Schema:** Verify cascade delete constraints (should exist from earlier modules)

### No Changes To

- User-facing delete functionality (users can still delete own content)
- Non-admin users cannot access these actions

## Data Flow

### User Deletion Flow

1. **Trigger:** Admin clicks delete button on user
2. **Fetch User Stats:** Query count of user's posts, comments
3. **Confirmation:** Show modal: "Delete user @username and all X posts, Y comments?"
4. **Admin Confirms:** Clicks confirm button
5. **Authorization:** Server Action verifies admin status
6. **Database Delete:** DELETE FROM users WHERE id = userId
7. **Cascade:** Database automatically deletes:
    - All posts by user (via FK cascade)
    - All comments by user (via FK cascade)
    - All likes by user (via FK cascade)
    - All follows by/to user (via FK cascade)
8. **Conditional Branches:**
    - If success → Remove from list, show toast "User deleted"
    - If user not found → Show error "User not found"
    - If not admin → Return error "Not authorized"
    - If database error → Show error "Failed to delete user"
9. **Final State:** User and all content removed from database

### Post Deletion Flow

1. **Trigger:** Admin clicks delete button on post
2. **Fetch Post Stats:** Query count of post's likes, comments
3. **Confirmation:** Show modal: "Delete post and X likes, Y comments?"
4. **Admin Confirms:** Clicks confirm
5. **Server Action:** adminDeletePost(postId) with admin verification
6. **Database Delete:** DELETE FROM posts WHERE id = postId
7. **Cascade:** Likes and comments deleted (FK cascade from Module 6)
8. **Success:** Remove from list, show toast
9. **Final State:** Post and associated data deleted

### Comment Deletion Flow

1. **Trigger:** Admin clicks delete on comment
2. **Confirmation:** "Delete this comment?" (simpler, no cascade)
3. **Server Action:** adminDeleteComment(commentId)
4. **Database Delete:** DELETE FROM comments WHERE id = commentId
5. **Success:** Remove from list, show toast
6. **Final State:** Comment deleted

## UX Specification

### User Flow

- Trigger: Click delete button next to user/post/comment
- Step 1: See confirmation modal with details
- Step 2: Modal shows what will be deleted (cascade info)
- Step 3: Click "Cancel" to dismiss or "Delete" to confirm
- Step 4: Brief loading state on delete button
- Step 5: Item removed from list
- Step 6: Success toast appears

### Empty States

- After deleting last item on page: Load previous page or show empty state

### Loading States

- During deletion: Delete button shows spinner or "Deleting..."
- Modal remains open during deletion

### Error States

- Deletion fails: Toast "Failed to delete [item]. Please try again."
- Network timeout: Same error toast
- Item already deleted: Toast "[Item] not found (may be already deleted)"

### Responsive Behavior

- Desktop: Modal centered, readable size
- Mobile: Modal takes most of screen, large touch targets
- All sizes: Clear cancel and delete buttons

## Things to Watch For

**Authorization Not Checked** → Non-admin could call delete actions → Prevention: Always verify isAdmin in Server Actions, not just UI

**Confirmation Bypass** → Delete happens without confirmation → Prevention: Always show modal, require explicit confirm click

**Cascade Failure** → User deleted but posts remain → Prevention: Verify foreign key constraints have ON DELETE CASCADE

**Cascade Not Informed** → Admin doesn't know impact → Prevention: Query and display counts before deletion

**Delete Own Account** → Admin deletes themselves → Prevention: Allow but warn "You will be logged out"

**Delete Last Admin** → Removing only admin locks everyone out → Prevention: Warn if deleting last admin, or prevent

**Double Delete** → Clicking delete twice causes issues → Prevention: Disable button during deletion

**Orphaned Data** → Some data not cascade deleted → Prevention: Verify all foreign keys properly configured with CASCADE

**Image Files Not Deleted** → R2 images remain after post delete → Prevention: Acceptable for MVP (discussed in Module 6), or add R2 deletion

**User Deletion Side Effects** → Deleted user's follows, likes orphaned → Prevention: Should cascade via FK constraints, verify in testing

**No Undo** → Can't reverse accidental deletion → Prevention: Confirmation helps prevent accidents, no undo in MVP

**Soft Delete Confusion** → Implementing soft delete when spec says hard → Prevention: MVP uses permanent deletion as specified

**Deleted User Still in Session** → User deleted but session active → Prevention: Not critical, user will be logged out on next request

**Modal Z-Index** → Modal hidden behind content → Prevention: High z-index on modal (9999)

**Modal Not Closable** → Can't cancel confirmation → Prevention: Prominent cancel button, clicking outside closes modal

**Delete Button Always Visible** → Delete button on own account confusing → Prevention: Acceptable, or add "(You)" label

**Success Feedback Missing** → No indication deletion worked → Prevention: Show success toast and remove from list

**List Not Updating** → Item remains visible after delete → Prevention: Optimistic removal or refresh list after deletion

**Pagination After Delete** → Current page empty after deleting last item → Prevention: Reload current page or navigate to previous page

**Error Not Displayed** → Silent failure → Prevention: Always show error toast on failure

**Transaction Rollback** → Partial deletion if error occurs → Prevention: Database transactions ensure atomic operations

**Race Condition** → Deleting while user is posting → Prevention: Database handles this, post creation fails if user deleted

**Admin Activity Log** → No record of who deleted what → Prevention: Optional enhancement, not required for MVP

**Bulk Delete** → Can't delete multiple items at once → Prevention: Out of scope for MVP, single delete sufficient

**Delete Confirmation Text** → Generic text not helpful → Prevention: Specific text: "Delete user @john and 23 posts?"

**Modal Animation Jarring** → Abrupt appearance → Prevention: Add fade-in CSS transition

**Keyboard Access** → Can't confirm with keyboard → Prevention: Ensure Enter confirms, Escape cancels

**Screen Reader** → Modal not announced → Prevention: Add ARIA labels, role="dialog"

**Delete Button Style** → Not obvious it's dangerous action → Prevention: Red color, trash icon, clear label

**Cascade Count Wrong** → Shows "5 posts" but user has 6 → Prevention: Query counts accurately, test with real data

**Network Error During Delete** → Request times out → Prevention: Handle timeout, show error, don't remove from UI

**Optimistic Removal Issue** → Item removed from UI but delete failed → Prevention: Wait for server confirmation before removing, or rollback on error

**Modal Overlay Click** → Clicking outside closes without warning → Prevention: Either prevent close or require cancel button click

**Delete Loading Stuck** → Button stuck in loading state → Prevention: Always end loading state on success or error

**Multiple Modals** → Opening multiple delete modals → Prevention: Only one modal open at a time, close previous before opening new

## Testing Verification

### Existing Features Still Work

- [ ]  Admin lists still display
- [ ]  Regular users unaffected
- [ ]  User-facing delete still works

### New Functionality Works

- [ ]  Delete button appears on each list item
- [ ]  Clicking delete shows confirmation modal
- [ ]  Modal displays cascade information (counts)
- [ ]  Cancel button closes modal without deleting
- [ ]  Confirm button deletes item
- [ ]  Item removed from list after deletion
- [ ]  Success toast appears
- [ ]  All three delete types work (user, post, comment)

### Edge Cases

- [ ]  Deleting user cascades to all their posts and comments
- [ ]  Deleting post cascades to likes and comments
- [ ]  Deleting already-deleted item shows appropriate error
- [ ]  Double-clicking delete doesn't cause issues
- [ ]  Network error shows error toast
- [ ]  Admin can delete own account (with warning)
- [ ]  Modal accessible with keyboard (Enter/Escape)
- [ ]  Modal announced to screen readers
- [ ]  Delete button disabled during deletion
- [ ]  Mobile modal displays correctly

---

## Feature Acceptance Tests

**Run these after all 3 chunks are complete:**

### Core Tests (from Module Brief)

- [ ]  Admin user navigates to /admin → Dashboard loads successfully
- [ ]  Non-admin user navigates to /admin → Redirected with error
- [ ]  Dashboard displays correct counts (manually verify)
- [ ]  View users list → All users displayed
- [ ]  Delete user → Confirmation shown → User and all content deleted
- [ ]  View posts list → All posts displayed chronologically
- [ ]  Delete post → Confirmation shown → Post deleted with likes and comments
- [ ]  Delete comment → Confirmation shown → Comment deleted

### Edge Cases (from Module Brief)

- [ ]  Delete user with 50 posts and 200 comments → All content deleted (cascade)
- [ ]  Delete post with 100 likes and 50 comments → All deleted (cascade)
- [ ]  Admin deletes their own account → Account deleted successfully
- [ ]  Try to delete already-deleted user → Error handled gracefully

### Integration Tests

- [ ]  Admin deletes User A → User A can no longer log in
- [ ]  Admin deletes Post X → Post X no longer appears in feed or permalink
- [ ]  Admin deletes Comment Y → Comment Y no longer appears on post
- [ ]  Admin actions while regular users active → No interference

---

## Implementation Notes

**Database Cascade Configuration:**

Verify all foreign keys have ON DELETE CASCADE:

- posts.userId → [users.id](http://users.id)
- comments.postId → [posts.id](http://posts.id)
- comments.userId → [users.id](http://users.id)
- likes.postId → [posts.id](http://posts.id)
- likes.userId → [users.id](http://users.id)
- follows.followerId → [users.id](http://users.id)
- follows.followingId → [users.id](http://users.id)

**Authorization Pattern:**

```tsx
export async function adminDeleteUser(userId: string) {
  'use server'
  
  // Always verify admin status
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return { error: 'Not authorized' };
  }
  
  // Proceed with deletion
  await db.delete(users).where(eq([users.id](http://users.id), userId));
  return { success: true };
}
```

**Performance Considerations:**

- Pagination essential for large datasets
- Use indexes on foreign keys for cascade performance
- Count queries should be fast with indexes
- Deletion might be slow for users with 10,000+ posts (acceptable)

**Security Checklist:**

- [ ]  All admin routes protected by middleware
- [ ]  All admin Server Actions verify isAdmin
- [ ]  No sensitive data exposed in lists (e.g., password hashes)
- [ ]  Confirmation required for all deletions
- [ ]  Cascade deletions configured correctly
- [ ]  Error messages don't expose system details

**Accessibility Checklist:**

- [ ]  Tables have proper headers
- [ ]  Links and buttons keyboard accessible
- [ ]  Confirmation modals have proper ARIA
- [ ]  Screen readers can navigate admin interface