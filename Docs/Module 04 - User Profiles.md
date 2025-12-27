# Feature: User Profiles

**Core Problem:** Give users a personal space to showcase their identity, posts, and social connections, enabling the social graph foundation.

**Total Chunks:** 4

**Total Estimated Duration:** 10-14 hours

**Feature Tracker Type:** New Feature

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Profile Data Layer & Queries | 📊 | 2-3 hrs | Module 2 (Auth system with users table) |
| 2 | Profile Viewing Pages | 🎨 | 3-4 hrs | Chunk 1 (Can query profile data) |
| 3 | Profile Editing & Bio Update | ⚙️ | 2-3 hrs | Chunk 2 (Profile pages render) |
| 4 | Profile Picture Upload | 🔌 | 3-4 hrs | Module 5 (Image upload service), Chunk 3 (Edit profile works) |

---

# Chunk 1: 📊 Profile Data Layer & Queries

Duration: 2-3 hours | Prerequisites: Module 2 completed (Auth system with users table exists)

## Quick Reference

**Builds:** Database queries and data access layer for fetching profile information including user details, post counts, follower/following counts, and posts grid.

**Connects:** Username input → Profile query → Database → Returns user + stats + posts | Current user check → Ownership validation

**Pattern:** Drizzle ORM queries with joins, aggregations, and proper indexing for performant profile loading

**Watch For:**

1. N+1 query problem when loading posts grid with user data
2. Follower/following counts slow without proper indexes
3. Profile queries not case-insensitive allowing username enumeration

## Context

### User Problem

Application needs efficient database queries to fetch complete profile data including user info, statistics, and recent posts before profile pages can be built.

### From Module Brief

- **Profile data**: username, bio, profilePictureUrl, follower count, following count, posts count
- **Posts grid**: User's posts ordered by newest first
- **Username lookup**: Find user by username (case-sensitive per spec)
- **Ownership detection**: Determine if current user is viewing own profile
- **404 handling**: Distinguish between non-existent users and valid empty profiles

## What's Changing

### New Additions

- **Profile query function**: Fetches user by username with all profile fields (id, username, bio, profilePictureUrl, createdAt)
- **Profile stats query**: Aggregates follower count, following count, posts count for user
- **Profile posts query**: Fetches user's posts ordered by createdAt DESC with pagination
- **Username existence check**: Quick query to verify if username exists before fetching full profile
- **Profile ownership utility**: Compares current user ID with profile user ID
- **Default avatar utility**: Returns default avatar URL when user has no profile picture
- **Profile not found error type**: Custom error for non-existent usernames
- **Profile response type**: TypeScript type combining user data, stats, posts, isOwnProfile flag

### Modifications to Existing

- **No database schema changes**: Uses existing users, posts, follows tables from Module 1

### No Changes To

- **UI components**: Data layer only, no visual changes
- **Authentication**: Profile queries use existing auth context
- **Image upload**: Not implemented in this chunk (Chunk 4)

## Data Flow

### Profile Data Fetch Flow

1. User navigates to /profile/[username] or /@[username]
2. Profile query function receives username from URL
3. Query users table WHERE username = ? (case-sensitive)
- If no user found → Return null, trigger 404
- If user found → Continue with [user.id](http://user.id)
1. Query follower count: COUNT(*) FROM follows WHERE followingId = [user.id](http://user.id)
2. Query following count: COUNT(*) FROM follows WHERE followerId = [user.id](http://user.id)
3. Query posts count: COUNT(*) FROM posts WHERE userId = [user.id](http://user.id)
4. Query recent posts: SELECT * FROM posts WHERE userId = [user.id](http://user.id) ORDER BY createdAt DESC LIMIT 20
5. Check ownership: currentUserId === profileUserId
6. Combine all data into profile response object
- If successful → Return {user, stats, posts, isOwnProfile}
- If any query fails → Log error, return partial data or error
1. Final state: Complete profile data ready for rendering

### Posts Grid Pagination Flow

1. User scrolls to bottom of profile
2. Request next page of posts with cursor (last post's createdAt)
3. Query posts WHERE userId = ? AND createdAt < cursor ORDER BY createdAt DESC LIMIT 20
4. Return posts array
5. If empty array → No more posts
6. Final state: Additional posts loaded for grid

### Stats Aggregation Flow

1. Profile data fetch triggers stats queries
2. Three COUNT queries run (can be parallel or single query with subqueries)
3. Results combined into stats object {followers: X, following: Y, posts: Z}
4. Cache stats briefly (optional optimization)
5. Final state: Current counts displayed on profile

## Things to Watch For

**N+1 query problem** → Loading 20 posts each triggers separate query for user data → Use single query with JOIN or ensure user data already available from profile query

**Follower count query slow** → COUNT(*) without index on follows.followingId → Verify index exists from Module 1 schema, test with large dataset (10k+ follows)

**Following count query slow** → COUNT(*) without index on follows.followerId → Same as above, index should exist

**Posts count slow** → COUNT(*) on large posts table → Index on posts.userId should exist, consider caching count or denormalizing

**Username lookup case-insensitive** → User can't find profile with different case → Per Master Spec, usernames are case-sensitive, document this clearly

**Username with special characters** → URL encoding breaks query → Properly decode username from URL params, handle special characters

**SQL injection via username** → Attacker manipulates query → Drizzle uses parameterized queries, but validate username format before query

**Profile query returns multiple users** → Should be impossible with unique constraint → Use LIMIT 1 or .findFirst() to ensure single result

**Stats queries run sequentially** → Slow page load (3 separate roundtrips) → Run COUNT queries in parallel with Promise.all() or use single query with subqueries

**Posts query doesn't limit results** → Returns entire post history, slow and large response → Always LIMIT to reasonable number (20-30), implement pagination

**Posts include deleted posts** → User sees own deleted posts → Ensure posts query doesn't have soft delete logic (spec says permanent deletion)

**Posts missing user data** → Need to join users table for author info → In profile context, all posts belong to profile user, no join needed

**Cursor pagination logic incorrect** → Skips or duplicates posts → Use createdAt < cursor for next page, test with posts created at same timestamp

**No pagination cursor returned** → Client doesn't know what cursor to use for next page → Return lastPostCreatedAt with posts array

**Empty profile vs non-existent user** → Both return no posts, confusing → Check if user exists first, return 404 if not, return empty array if user exists with no posts

**Default avatar not consistent** → Different default images across app → Centralize default avatar logic in utility function, use same URL everywhere

**Profile picture URL validation** → Stored URL is invalid or broken → Check if URL exists and is valid format before using, fall back to default avatar

**Bio null vs empty string** → Inconsistent handling → Treat null and empty string the same, display "No bio yet" or similar

**CreatedAt timestamp format** → Client receives different formats → Return ISO 8601 format consistently, let client format for display

**FollowingId vs followerId confusion** → Counts are swapped → followingId is the person being followed, followerId is the person following, verify queries

**Stats include current user** → User's own follow of themselves counted → Users can't follow themselves per spec, but verify queries don't count self

**Blocked users shown in counts** → Future feature consideration → No blocking in MVP, but design queries to support WHERE NOT blocked clause later

**Deleted users in follows** → Foreign key constraint should cascade → Verify ON DELETE CASCADE in follows table, deleted users remove their follows

**Profile data cached too long** → Stats out of date → For MVP, no caching or very short (30s), plan cache invalidation strategy

**Query timeout on large profiles** → User with 1M followers causes timeout → Set reasonable query timeout (5s), optimize with indexes, consider pagination for follower lists (not in MVP)

**Transaction not needed but used** → Read queries in unnecessary transaction → Only use transactions for writes, profile reads are safe without transactions

**Database connection leak** → Connections not released → Drizzle handles connection pooling, but verify queries don't hold connections open

**Multiple database calls** → Each stat requires separate query → Acceptable for MVP, optimize later with single query using SQL subqueries or window functions

**Posts query includes likes/comments count** → Requires additional joins → Not needed for this chunk, posts grid shows just images, counts added in Module 6/7/8

**Profile query includes private fields** → Returns passwordHash or sensitive data → Only SELECT public fields (id, username, bio, profilePictureUrl, createdAt), never return passwordHash

**Email exposed in profile** → Privacy concern → Email is not part of public profile per spec, never include in profile query results

**Admin flag exposed** → Security risk → Only expose isAdmin to admins themselves or in admin panel, not on public profiles

**Email verification status exposed** → Reveals verification state → Not needed in profile data, keep emailVerified private

**Username enumeration possible** → Attacker can list all usernames → Profile lookup by username is intentional feature, rate limit profile requests if abuse detected

**Profile response type not strict** → Runtime errors from missing fields → Define strict TypeScript interface for profile response, validate all fields exist

**Null handling inconsistent** → Some nulls shown as null, others as undefined → Standardize on null for missing values (bio, profilePictureUrl), never undefined

**Posts array null vs empty** → Different semantics → Always return array (empty if no posts), never null

**Stats object shape inconsistent** → Sometimes {followers: 0} other times {followerCount: 0} → Standardize property names, use same shape everywhere

**TypeScript types not inferred** → Manual types out of sync with schema → Use Drizzle's InferModel type to derive types from schema automatically

## Testing Verification

### Existing Features Still Work

- [ ]  Authentication works → Can get current user ID
- [ ]  Database queries work → Can query users and posts tables

### New Functionality Works

- [ ]  Query profile by username → Returns user object
- [ ]  Query profile that doesn't exist → Returns null
- [ ]  Query follower count → Returns correct count (0 initially)
- [ ]  Query following count → Returns correct count (0 initially)
- [ ]  Query posts count → Returns correct count
- [ ]  Query user's posts → Returns array of posts ordered by createdAt DESC
- [ ]  Query posts with limit → Returns max 20 posts
- [ ]  Check ownership for own profile → Returns true
- [ ]  Check ownership for other user's profile → Returns false
- [ ]  Get default avatar URL → Returns consistent URL

### Edge Cases

- [ ]  Query username with special characters → Handles correctly or returns 404
- [ ]  Query username in different case → Returns user (case-sensitive) or 404
- [ ]  Query user with 0 posts → Returns empty array not null
- [ ]  Query user with 1000 posts → Returns first 20 only
- [ ]  Pagination cursor at end of posts → Returns empty array
- [ ]  User with null bio → Returns null, doesn't throw error
- [ ]  User with null profilePictureUrl → Default avatar used
- [ ]  Concurrent stats queries → All complete successfully

---

# Chunk 2: 🎨 Profile Viewing Pages

Duration: 3-4 hours | Prerequisites: Chunk 1 completed (Can query profile data from database)

## Quick Reference

**Builds:** Complete profile viewing experience with user info display, statistics, posts grid, and both URL patterns (/profile/[username] and /@[username]).

**Connects:** URL → Username extraction → Profile query → Render profile layout → Display user info + stats + posts grid

**Pattern:** Next.js dynamic routes with Server Components, shadcn/ui for layout, responsive grid for posts

**Watch For:**

1. Posts grid not responsive on mobile (single column vs multi-column)
2. 404 page not shown for non-existent users
3. Clickable usernames throughout app not linking to profile

## Context

### User Problem

Users need to view their own and others' profiles with clear presentation of identity, statistics, and content.

### From Module Brief

- **Dual URL patterns**: Support both /profile/[username] and /@[username]
- **Profile layout**: Profile picture, username, bio, follower/following/posts counts
- **Posts grid**: Thumbnail images in responsive grid, newest first
- **Empty states**: Clear messaging when profile has no posts or bio
- **Own profile indicator**: Visual distinction (Edit Profile button vs Follow button)
- **404 handling**: User-friendly error for non-existent profiles
- **Responsive design**: Mobile (1 column), tablet (2-3 columns), desktop (3-4 columns)

## What's Changing

### New Additions

- **Profile page route**: app/profile/[username]/page.tsx Server Component
- **Profile @ route**: app/@[username]/page.tsx redirects to /profile/[username]
- **Profile layout component**: Displays profile header with avatar, username, bio, stats
- **Avatar component**: Shows profile picture or default avatar with proper sizing
- **Profile stats component**: Displays follower, following, posts counts in row
- **Posts grid component**: Responsive grid of post thumbnails
- **Post thumbnail component**: Clickable image that navigates to post permalink
- **Empty posts state**: "No posts yet" message when user has no posts
- **Empty bio state**: Placeholder text when bio is null/empty
- **Edit Profile button**: Shown only on own profile
- **Follow button placeholder**: Shown on other profiles (functionality in Module 9)
- **Profile not found page**: Custom 404 for invalid usernames
- **Username link component**: Reusable component for clickable usernames

### Modifications to Existing

- **App routing**: Add profile routes to app directory
- **Navigation**: Add links to profile from username mentions

### No Changes To

- **Database queries**: Uses data layer from Chunk 1
- **Authentication**: No auth changes
- **Follow functionality**: Button is placeholder, Module 9 implements

## Data Flow

### Profile Page Load Flow

1. User navigates to /profile/john or /@john
2. Next.js route extracts username from params
3. If /@[username] route → Redirect to /profile/[username]
4. Server Component calls profile query from Chunk 1
5. Profile query returns user data + stats + posts
- If user not found → Render 404 page
- If user found → Continue
1. Check if own profile (currentUserId === profileUserId)
2. Render profile layout with data
3. Render avatar (profile picture or default)
4. Render username and bio
5. Render stats row (followers, following, posts)
6. Render Edit Profile or Follow button based on ownership
7. Render posts grid (or empty state)
8. Final state: Profile page fully rendered

### Posts Grid Rendering Flow

1. Posts array received from profile query
2. Check if empty → Show "No posts yet" message
3. If posts exist → Map over posts array
4. For each post, render thumbnail component
5. Thumbnail shows imageUrl (or thumbnailUrl if available)
6. Each thumbnail links to /post/[postId]
7. Grid adjusts columns based on viewport width
- Mobile: 1 column
- Tablet: 2-3 columns
- Desktop: 3-4 columns
1. Final state: Responsive grid of clickable post thumbnails

### Username Click Flow

1. User clicks username anywhere in app (comment, post author, etc.)
2. Username link component navigates to /profile/[username]
3. Profile page loads with clicked user's profile
4. Final state: User viewing profile of clicked username

## Things to Watch For

**Redirect from /@username breaks** → Next.js redirect() called incorrectly → Use redirect() from next/navigation in Server Component, pass /profile/${username}

**Username not decoded from URL** → Special characters break query → Use decodeURIComponent() on params.username before querying

**Username with slash breaks routing** → URL like /@john/doe fails → Validate username format, usernames shouldn't contain slashes per spec

**404 not shown for invalid username** → Error page not triggered → Check if query returns null, call notFound() from next/navigation

**notFound() doesn't work** → Default 404 shown → Ensure not-found.tsx exists in profile directory for custom 404

**Profile picture not loading** → Broken image shown → Add error handling on img tag, onError falls back to default avatar

**Default avatar not displayed** → Null profilePictureUrl shows broken image → Check if profilePictureUrl is null before rendering, use default avatar utility

**Avatar not circular** → Square image looks unprofessional → Use CSS border-radius: 50% or Tailwind rounded-full class

**Avatar size inconsistent** → Different sizes across pages → Standardize avatar sizes: large (150px) on profile, small (40px) on posts/comments

**Bio with line breaks** → Line breaks not preserved in HTML → Use white-space: pre-wrap CSS or convert n to 

**Bio with HTML tags** → XSS vulnerability → Sanitize bio, render as plain text, or use DOMPurify if allowing markdown

**Bio null vs empty string** → Displayed differently → Treat both as "No bio yet", consistent empty state

**Stats not formatted** → 1000 followers shows as "1000" not "1K" → For MVP, show raw numbers, plan formatting (1K, 1M) for polish phase

**Stats not clickable** → User can't view follower list → Per Master Spec, follower/following lists NOT implemented, stats are display-only

**Edit Profile button on other profiles** → Security issue → Only show if isOwnProfile === true, verify server-side

**Follow button functional** → Not implemented yet → Show disabled button or placeholder, implement in Module 9

**Posts grid not responsive** → Fixed columns on mobile → Use CSS Grid with auto-fit or Tailwind responsive classes (grid-cols-1 md:grid-cols-3)

**Posts grid images not square** → Varying aspect ratios look messy → Use aspect-ratio: 1/1 CSS or object-fit: cover to force square

**Thumbnail shows full-size image** → Slow loading, high bandwidth → Use thumbnailUrl field (from Module 5) not imageUrl for grid

**Images don't lazy load** → All images load immediately, slow page → Use loading="lazy" on img tags or Next.js Image component

**No image blur placeholder** → Jarring pop-in when images load → Use blurHash from database (Module 5) for smooth loading

**Posts grid not paginated** → Shows only first 20 posts → For MVP, 20 posts is acceptable, plan infinite scroll or "Load More" for Module 6

**Empty posts state confusing** → User doesn't know why no posts → Clear message: "No posts yet" on others' profiles, "Share your first post!" on own profile

**Post thumbnail not clickable** → No way to view post detail → Wrap thumbnail in Link to /post/[postId]

**Post thumbnail hover state missing** → No visual feedback → Add hover opacity or border change for better UX

**Username not prominent** → Hard to identify whose profile → Use large, bold font for username in profile header

**Profile header not sticky** → Stats scroll away, hard to reference → For MVP, no sticky header, can add in polish phase

**Back button functionality unclear** → User doesn't know how to return → Browser back button works, optionally add back arrow in navigation

**Loading state not shown** → Blank page during profile fetch → Server Components don't need loading state, but add loading.tsx for route loading UI

**Error state not handled** → Database error shows blank page → Wrap profile query in try-catch, show error page if query fails

**Concurrent profile loads** → Multiple tabs loading same profile → Acceptable, Next.js handles concurrent requests, consider caching

**Profile data stale** → Counts don't update after actions → For MVP, refresh page to see updates, plan real-time updates later

**Own profile not obvious** → User confused if viewing own or other profile → Visual distinction: Edit Profile button, different header color, or "Your Profile" indicator

**Username copyable** → User wants to share username → Make username selectable text, not image or custom font

**Deep linking to profile** → URL shared elsewhere doesn't work → Ensure both /profile/username and /@username work from external links

**SEO metadata missing** → Profile pages don't show in search results → Add metadata export with user's name and bio for social sharing

**Open Graph tags missing** → Profile links don't preview nicely → Generate OG tags with profile picture, username, bio

**Accessibility issues** → Screen readers can't navigate → Add proper heading hierarchy (h1 for username), alt text for avatar

**Keyboard navigation broken** → Can't tab through profile → Ensure all interactive elements (posts, buttons) are keyboard accessible

**Profile page slow** → Multiple database queries block render → Server Components stream, but optimize queries to be fast (<100ms)

**TypeScript errors** → Props not typed correctly → Define strict types for all components receiving profile data

**Responsive breakpoints wrong** → Grid looks bad at certain widths → Test at common breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)

**Avatar upload UI shown** → Not implemented until Chunk 4 → Don't show upload button yet, just display current avatar

## UX Specification

### User Flow

- **View Profile**: Click username anywhere → Navigate to profile → See user info, stats, posts
- **View Own Profile**: Navigate to own profile → See "Edit Profile" button → Can navigate to edit page (Chunk 3)
- **View Posts**: On profile → Click post thumbnail → Navigate to post permalink

### Empty States

- **No bio**: "No bio yet" or empty space
- **No posts**: "No posts yet" centered in posts grid area
- **Own profile no posts**: "Share your first post!" with create post button

### Loading States

- Route loading: Next.js default loading UI or custom loading.tsx
- Images: Blur placeholder from blurHash (Module 5) or gray background

### Error States

- **User not found**: Custom 404 page "User not found" with link to home
- **Query error**: Error page "Couldn't load profile. Please try again."

### Responsive Behavior

- **Mobile**: Avatar medium (100px), 1-column posts grid, stats stacked
- **Tablet**: Avatar large (150px), 2-3 column posts grid, stats in row
- **Desktop**: Avatar large (150px), 3-4 column posts grid, stats in row with spacing

## Testing Verification

### Existing Features Still Work

- [ ]  Profile queries return data → Data layer from Chunk 1 works
- [ ]  Authentication provides current user → Can determine ownership

### New Functionality Works

- [ ]  Navigate to /profile/username → Profile page loads
- [ ]  Navigate to /@username → Redirects to /profile/username
- [ ]  Profile shows avatar → Image or default avatar displayed
- [ ]  Profile shows username → Correct username displayed
- [ ]  Profile shows bio → Bio text displayed (or empty state)
- [ ]  Profile shows stats → Followers, following, posts counts shown
- [ ]  Own profile shows Edit Profile button → Button visible and styled
- [ ]  Other profile shows Follow button → Placeholder button shown (not functional)
- [ ]  Posts grid shows thumbnails → Images displayed in grid
- [ ]  Click post thumbnail → Navigate to /post/[id]
- [ ]  Profile with no posts → "No posts yet" message shown
- [ ]  Navigate to invalid username → 404 page shown

### Edge Cases

- [ ]  Username with special characters in URL → Handled correctly
- [ ]  Profile with null bio → Empty state shown, no error
- [ ]  Profile with null profilePictureUrl → Default avatar shown
- [ ]  Profile with 0 followers → "0 followers" shown
- [ ]  Profile with 1 follower → "1 follower" shown (singular)
- [ ]  Posts grid on mobile → Single column layout
- [ ]  Posts grid on desktop → Multi-column layout
- [ ]  Very long username → Wraps or truncates appropriately
- [ ]  Very long bio → Wraps appropriately, doesn't break layout

---

# Chunk 3: ⚙️ Profile Editing & Bio Update

Duration: 2-3 hours | Prerequisites: Chunk 2 completed (Profile pages render correctly)

## Quick Reference

**Builds:** Profile editing functionality allowing users to update bio with 150-character limit and validation.

**Connects:** Edit Profile button → Edit form page → Bio input → Server Action → Database update → Redirect to profile

**Pattern:** Server Action for bio update with validation, client component for form with character counter

**Watch For:**

1. Bio update allows more than 150 characters server-side
2. Edit form accessible to other users (authorization bypass)
3. Bio not properly sanitized allowing XSS

## Context

### User Problem

Users need to personalize their profile by adding a bio describing themselves.

### From Module Brief

- **Edit profile page**: Separate page for editing profile info
- **Bio field**: Text input with 150-character limit
- **Character counter**: Live count showing remaining characters
- **Validation**: Client and server-side enforcement of 150-char limit
- **Authorization**: Only profile owner can edit their profile
- **Profile picture**: Editing implemented in Chunk 4
- **Username**: Cannot be changed (permanent per spec)

## What's Changing

### New Additions

- **Edit profile route**: app/profile/[username]/edit/page.tsx Server Component
- **Edit profile form**: Client Component with bio textarea and character counter
- **Bio update Server Action**: Validates and updates user bio in database
- **Authorization check**: Ensures current user owns profile being edited
- **Character counter component**: Shows X/150 characters with color coding
- **Save button**: Submits form, shows loading state
- **Cancel button**: Returns to profile without saving
- **Success feedback**: Toast notification or redirect message
- **Validation error display**: Shows error if bio exceeds 150 characters

### Modifications to Existing

- **Edit Profile button**: Links to /profile/[username]/edit
- **Users table**: Updates bio column

### No Changes To

- **Profile viewing pages**: Still use Chunk 2 layout
- **Profile picture**: Not editable yet (Chunk 4)
- **Username**: Cannot be changed per spec

## Data Flow

### Edit Profile Page Load Flow

1. User clicks "Edit Profile" button on own profile
2. Navigate to /profile/[username]/edit
3. Server Component extracts username from params
4. Query current user from session
5. Query profile user from username
6. Check authorization: [currentUser.id](http://currentUser.id) === [profileUser.id](http://profileUser.id)
- If not authorized → Return 403 error or redirect to profile
- If authorized → Continue
1. Render edit form with current bio value pre-filled
2. Final state: Edit form ready for input

### Bio Update Flow

1. User types in bio textarea
2. Character counter updates on every keystroke
3. Counter shows characters used / 150
- If > 135 chars → Counter turns yellow (warning)
- If > 150 chars → Counter turns red, save button disabled
1. User clicks "Save" button
2. Client-side validation: bio.length <= 150
- If invalid → Show error, prevent submission
- If valid → Continue
1. Call bio update Server Action with new bio text
2. Server Action validates bio length <= 150
3. Server Action updates users table: UPDATE users SET bio = ? WHERE id = ?
- If update fails → Return error
- If update succeeds → Continue
1. Revalidate profile page cache
2. Redirect to profile page
3. Final state: Profile shows updated bio

### Cancel Flow

1. User clicks "Cancel" button
2. Discard any changes
3. Navigate back to profile page
4. Final state: Bio unchanged

## Things to Watch For

**Client-side limit bypassed** → User submits >150 chars via API → Always validate bio.length <= 150 in Server Action, never trust client

**Character count incorrect** → Unicode characters counted wrong → Use .length on string, be aware emoji may count as multiple chars, acceptable for MVP

**Character counter not real-time** → Updates on blur not on type → Use onChange event to update counter on every keystroke

**Save button not disabled** → User can submit invalid bio → Disable button when bio.length > 150

**Loading state missing** → No feedback during save → Show spinner, disable form during Server Action execution

**Authorization check missing** → Any user can edit any profile → Verify currentUserId === profileUserId in Server Action before update

**Authorization check client-only** → Bypassed by API call → Must check authorization in Server Action, client check is UX only

**Edit page accessible via URL** → User types /profile/othername/edit in URL → Server Component checks authorization, redirects if not authorized

**Bio XSS vulnerability** → User enters <script> tags → Sanitize bio before saving, or rely on React's default escaping (sufficient for plain text)

**Bio with SQL injection** → Malicious bio breaks query → Drizzle uses parameterized queries, safe by default

**Line breaks not preserved** → User enters multi-line bio, displayed as single line → Store n characters, display with white-space: pre-wrap CSS

**Excessive whitespace** → Bio is all spaces → Consider trimming leading/trailing whitespace, but preserve internal spaces

**Empty bio saved as empty string** → Inconsistent with null → Standardize on null for empty bio or empty string, be consistent

**Bio update doesn't revalidate cache** → Profile page shows old bio → Call revalidatePath('/profile/username') after update

**Redirect before update completes** → Race condition, old bio shown → Await database update before redirecting

**No success feedback** → User doesn't know if save worked → Show toast notification "Profile updated" or display message on profile page

**Error not displayed** → Save fails silently → Catch Server Action errors, display error message in form

**Network error handling** → Timeout or connection error → Set reasonable timeout, show retry option

**Concurrent edits** → User edits in two tabs → Last write wins, acceptable for MVP, no conflict resolution

**Edit form loses changes** → Browser back button → Use form state management, consider warning on unsaved changes

**Textarea not autogrowing** → Fixed height looks cramped → Use min-height with auto-grow or large fixed height (rows={5})

**Textarea not styled** → Looks different from design system → Use shadcn/ui Textarea component for consistency

**Character counter placement** → Not visible while typing → Place below or beside textarea, always visible

**Counter color not semantic** → Hard to know when limit reached → Green (<135), yellow (135-150), red (>150)

**Cancel button too prominent** → Accidental clicks lose changes → Style Cancel as secondary button, Save as primary

**Unsaved changes warning missing** → User navigates away, loses work → Implement beforeunload event if time allows, or accept for MVP

**Edit form not responsive** → Looks bad on mobile → Test on mobile, ensure textarea is full-width, buttons stack vertically

**Keyboard shortcuts missing** → Can't save with Cmd+S → Nice to have, not critical for MVP

**Focus not managed** → Cursor not in textarea on load → Auto-focus textarea when form loads

**Validation message not clear** → Generic "Error" shown → Specific message: "Bio must be 150 characters or less"

**Multiple rapid saves** → Race condition, multiple updates → Debounce or disable button during save

**Database update partial** → Bio updated but cache not invalidated → Wrap in transaction if needed, or accept eventual consistency

**Username display editable** → Confuses user → Show username as read-only text, make it clear it can't be changed

**Email change UI shown** → Not in scope → Don't show email field, bio only for now

**Profile picture edit shown** → Not until Chunk 4 → Show current avatar but no edit button yet

**Other profile fields shown** → Scope creep → Only bio is editable in this chunk, keep form simple

**TypeScript types loose** → Bio could be wrong type → Define strict types for bio (string | null), validate runtime

## Testing Verification

### Existing Features Still Work

- [ ]  Profile viewing works → Can see own and others' profiles
- [ ]  Edit Profile button appears → Only on own profile

### New Functionality Works

- [ ]  Click Edit Profile button → Navigate to edit page
- [ ]  Edit page loads → Form displays with current bio
- [ ]  Type in bio textarea → Character counter updates
- [ ]  Bio at 135 chars → Counter turns yellow
- [ ]  Bio at 151 chars → Counter turns red, save button disabled
- [ ]  Click Save with valid bio → Profile updated, redirected
- [ ]  View profile after save → Updated bio displayed
- [ ]  Click Cancel → Return to profile, bio unchanged
- [ ]  Try to edit other user's profile → 403 error or redirect
- [ ]  Save empty bio → Saved as null or empty string

### Edge Cases

- [ ]  Bio with emoji → Character count accurate enough
- [ ]  Bio with line breaks → Line breaks preserved
- [ ]  Bio with only spaces → Saved (or trimmed)
- [ ]  Save bio with exactly 150 chars → Succeeds
- [ ]  Try to save 151 chars via API → Server rejects
- [ ]  Edit page via URL manipulation → Authorization check blocks
- [ ]  Network error during save → Error shown, can retry
- [ ]  Navigate away during save → Update completes or cancels gracefully

---

# Chunk 4: 🔌 Profile Picture Upload

Duration: 3-4 hours | Prerequisites: Module 5 completed (Image upload service exists), Chunk 3 completed (Edit profile works)

## Quick Reference

**Builds:** Profile picture upload functionality integrated with R2 image service, including crop/preview, default avatar fallback, and update flow.

**Connects:** Edit profile → Upload button → File picker → Image processing (Module 5) → R2 upload → Database update → Display new avatar

**Pattern:** Client Component for file input with preview, uses existing image upload utility from Module 5

**Watch For:**

1. Profile picture upload uses same storage as posts (namespace collision)
2. Old profile pictures not cleaned up from R2 (storage leak)
3. Image dimensions not optimized for avatar (wrong size uploaded)

## Context

### User Problem

Users need to personalize their profile with a photo representing their identity.

### From Module Brief

- **Profile picture upload**: Uses same mechanism as post images (Module 5)
- **File picker**: Standard file input accepting images
- **Image preview**: Show selected image before uploading
- **Processing**: Resize to appropriate avatar sizes (150px and 40px)
- **Storage**: Upload to R2 in dedicated profile-pictures folder
- **Default avatar**: Shown when user hasn't uploaded picture
- **Update flow**: Replace existing picture or set first time

## What's Changing

### New Additions

- **Avatar upload component**: File input with preview and upload button
- **Image preview component**: Shows selected image before upload
- **Profile picture Server Action**: Orchestrates upload and database update
- **Avatar resize logic**: Creates multiple sizes (150px, 40px) for different contexts
- **R2 folder structure**: profile-pictures/ folder separate from post images
- **Old image cleanup**: Deletes previous profile picture from R2 when new one uploaded
- **Upload progress indicator**: Shows percentage during upload
- **Avatar update in edit form**: Integrates upload into existing edit page

### Modifications to Existing

- **Edit profile page**: Add avatar upload section above bio field
- **Image upload utility** (Module 5): Reuse for profile pictures with different size parameters
- **Users table**: Update profilePictureUrl column
- **Avatar component**: Now can display uploaded pictures

### No Changes To

- **Profile viewing**: Still renders avatar from profilePictureUrl
- **R2 bucket**: Same bucket as posts, different folder
- **Image upload core logic**: Reuse from Module 5

## Data Flow

### Profile Picture Upload Flow

1. User on edit profile page clicks "Change profile picture" button
2. File input opens, user selects image file
3. Client validates file type and size (same as post images: max 50MB)
- If invalid → Show error
- If valid → Continue
1. Generate preview: read file as data URL, display in preview component
2. User clicks "Upload" button (or auto-upload on selection)
3. Show loading state with progress indicator
4. Call profile picture upload Server Action with file data
5. Server Action validates file again
6. Process image with Sharp:
    - Create avatar-large: 150x150px (for profile page)
    - Create avatar-small: 40x40px (for comments, posts)
    - Compress with quality 85
7. Generate unique filename: {userId}-avatar-{timestamp}.jpg
8. Upload both sizes to R2 in profile-pictures/ folder
9. Get public URLs for uploaded images
10. Check if user has existing profilePictureUrl
- If exists → Delete old images from R2 (cleanup)
- If null → Skip cleanup
1. Update users table: SET profilePictureUrl = newUrl WHERE id = userId
2. Revalidate profile page cache
3. Return success with new URL
4. Update preview to show uploaded image
5. Final state: New profile picture displayed on profile

### Default Avatar Display Flow

1. Avatar component receives profilePictureUrl prop
2. Check if URL is null or empty
- If null → Display default avatar SVG or generated avatar
- If URL exists → Display image from URL
1. Add error handling: onError displays default avatar
2. Final state: Avatar always shows (never broken image)

### Old Image Cleanup Flow

1. User uploads new profile picture
2. Server Action retrieves current profilePictureUrl from database
3. Parse URL to extract file paths (avatar-large and avatar-small)
4. Delete both files from R2 using AWS S3 SDK
- If deletion fails → Log error but continue (don't block new upload)
1. Old images removed from storage
2. Final state: Storage usage doesn't grow unbounded

## Things to Watch For

**Profile pictures mixed with posts** → Namespace collision, hard to manage → Store profile pictures in separate R2 folder: profile-pictures/ vs posts/

**Avatar sizes wrong** → Using post sizes (1200px) for avatar → Create avatar-specific sizes: 150x150px (large), 40x40px (small)

**Non-square images** → Avatar looks stretched → Crop to square aspect ratio (1:1) during processing, use object-fit: cover

**Old images not deleted** → R2 storage costs increase → Delete previous profilePictureUrl images before uploading new

**Cleanup fails silently** → Old images remain → Log deletion errors, but don't fail upload if cleanup fails

**User deletes picture** → No delete button → For MVP, user can upload new picture, no explicit delete, acceptable

**Default avatar not consistent** → Different styles across app → Use same default avatar generation (initials, placeholder) everywhere

**Default avatar boring** → Generic placeholder → Consider generating avatars from initials or using service like DiceBear

**Upload button always enabled** → No file selected, upload fails → Enable button only when file selected

**No preview before upload** → User doesn't see what will be uploaded → Show image preview immediately after file selection

**Preview not cropped** → Shows full image, not square → Preview should show how avatar will look (square, cropped)

**File size limit not enforced** → Huge images cause timeouts → Reuse 50MB limit from Module 5, reject larger files

**File type not validated** → Non-image files crash processing → Validate file.type matches image/* before processing

**Sharp processing fails** → Corrupted or unsupported image → Catch processing errors, show "Invalid image file" message

**R2 upload fails** → User thinks upload succeeded → Check upload response, show error if failed

**Database update fails** → Image uploaded but URL not saved → Wrap in transaction if possible, or delete uploaded image on failure

**Progress indicator not shown** → User doesn't know upload is happening → Show spinner or percentage progress bar

**Upload takes too long** → User navigates away → Acceptable for MVP, consider background upload later

**Multiple uploads simultaneously** → Race condition, wrong image saved → Disable upload button during processing

**Old URL format breaks** → Can't parse previous profilePictureUrl for deletion → Handle old URL formats gracefully, log parse errors

**R2 folder not created** → Upload fails with "folder doesn't exist" → R2 doesn't require folder creation, files can have slashes in names

**Public read access not set** → Images not accessible → Verify R2 bucket has public read policy for profile-pictures/* path

**CORS issues** → Can't upload from client → Profile pictures upload via Server Action (server-side), no CORS issues

**Image orientation wrong** → EXIF rotation not handled → Sharp auto-rotates based on EXIF data, verify this works

**Filename collisions** → Two users have same filename → Include userId in filename: {userId}-avatar-{timestamp}.jpg

**Timestamp precision** → Multiple uploads in same second → Use [Date.now](http://Date.now)() (milliseconds) or UUID for uniqueness

**Cache invalidation missing** → Old avatar shows after upload → Call revalidatePath after database update

**Upload form not in edit page** → Confusing separate page → Integrate upload into edit profile page from Chunk 3

**Bio and avatar save separately** → Two save buttons confusing → Keep separate for now, avatar auto-saves on upload, bio has Save button

**No crop tool** → User can't adjust framing → For MVP, auto-crop to center, plan crop tool for enhancement

**Aspect ratio not forced** → Upload allows non-square → Crop to 1:1 during processing, don't rely on user

**Quality too high** → Large file sizes → Use quality 85 for avatars, good balance of size and quality

**Small avatar blurry** → Generated from large too aggressively → Generate small avatar (40px) from original, not from large avatar

**Database stores both URLs** → Only large URL stored, small not accessible → Store large URL, derive small URL by pattern, or store both URLs

**Compression artifacts visible** → Quality too low → Test quality 85, adjust if needed (80-90 range)

**Mobile upload slow** → Large images take forever on slow connection → Acceptable for MVP, consider client-side resize before upload later

**No feedback after upload** → User doesn't know if succeeded → Show success message "Profile picture updated" or toast notification

**Avatar doesn't update immediately** → Page refresh required → Update avatar preview in edit form after upload success

**TypeScript file type wrong** → File upload type errors → Use File type from Web API, validate in Server Action

## Testing Verification

### Existing Features Still Work

- [ ]  Profile viewing shows avatar → Default or uploaded image
- [ ]  Edit profile loads → Can edit bio
- [ ]  Image upload utility works → From Module 5

### New Functionality Works

- [ ]  On edit page, click change profile picture → File picker opens
- [ ]  Select image file → Preview shown
- [ ]  Click upload → Loading state shown
- [ ]  Upload completes → Success message, new avatar displayed
- [ ]  View profile → New avatar shown (large version)
- [ ]  View post by user → Small avatar shown in author section
- [ ]  User with no avatar → Default avatar shown
- [ ]  Upload new avatar → Old avatar deleted from R2
- [ ]  Check R2 bucket → profile-pictures/ folder has images
- [ ]  Check database → profilePictureUrl updated

### Edge Cases

- [ ]  Upload very large image (10MB) → Processed and uploaded
- [ ]  Upload small image (50x50px) → Upscaled to 150px
- [ ]  Upload non-square image → Cropped to square
- [ ]  Upload image with EXIF rotation → Correctly oriented
- [ ]  Upload invalid file type → Error shown
- [ ]  Upload fails mid-process → Error shown, can retry
- [ ]  Upload second avatar → First avatar deleted from R2
- [ ]  Database has null profilePictureUrl → No cleanup attempted
- [ ]  R2 cleanup fails → Upload still succeeds, error logged

---

## Feature Acceptance Tests

**From Module Brief QA Criteria:**

Run these after all chunks complete to verify the full feature works.

**Core Tests:**

- [ ]  Navigate to valid username profile → Profile loads with all info displayed
- [ ]  Navigate to /profile/username and /@username → Both work identically
- [ ]  View profile with posts → Posts grid displays correctly
- [ ]  Click post in grid → Navigate to post permalink
- [ ]  View own profile → "Edit Profile" button visible
- [ ]  Edit bio and save → Changes persist and display
- [ ]  Upload profile picture → Image displays correctly

**Edge Cases:**

- [ ]  Navigate to non-existent username → 404 page shown
- [ ]  View profile with zero posts → "No posts yet" message shown
- [ ]  Bio at exactly 150 characters → Saves successfully
- [ ]  Bio at 151 characters → Validation error
- [ ]  Profile picture upload fails → Error shown, existing picture unchanged
- [ ]  Click username in comment → Navigate to correct profile

**Integration Tests:**

- [ ]  User A views User B's profile → Sees User B's posts only
- [ ]  Upload profile picture → View profile → Picture displays → Edit and change picture → New picture displays
- [ ]  Edit bio → Save → View profile → New bio displays → Edit again → Previous text pre-filled
- [ ]  New user (no bio, no picture) → Default avatar shows, empty bio state shows
