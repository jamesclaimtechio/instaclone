# Feature: User Search (Module 10)

**Core Problem:** Enable users to discover and connect with other users through username search with live results.

**Total Chunks:** 2

**Total Estimated Duration:** 4-6 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Module 4 (User Profiles)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Search Backend & Query | 📊 Data | 2-3 hrs | Module 4 complete (user profiles available) |
| 2 | Search UI with Live Results | 🎨 UI | 2-3 hrs | Chunk 1 complete (search queries working) |

---

# Chunk 1: 📊 Search Backend & Query

Duration: 2-3 hours | Prerequisites: Module 4 complete (users table populated, profiles displaying)

## Quick Reference

**Builds:** Database search query with partial matching and username indexing for fast results

**Connects:** Users table → Search Server Action → Filtered user results with profile info

**Pattern:** PostgreSQL ILIKE query with index optimization, debounced queries

**Watch For:** SQL injection, case sensitivity issues, performance with large user base, empty query handling

## Context

### User Problem

Users need a fast, intuitive way to find other users by username to view profiles and follow them.

### From Module Brief

- **Search Field:** Username only (not bio or other fields per Master Spec)
- **Partial Match:** Case-insensitive partial matching ("joh" finds "john123")
- **Live Search:** As-you-type with debouncing
- **Result Limit:** Max 10 results
- **Result Data:** Profile picture, username for each result
- **Navigation:** Click result navigates to profile
- **Index Usage:** Database index on username for performance

## What's Changing

### New Additions

- **searchUsers Server Action:** Accepts search query string, returns matching users
- **Username Search Query:** PostgreSQL ILIKE query for partial, case-insensitive matching
- **Result Limiting:** Returns top 10 matches ordered by relevance
- **Empty Query Handling:** Returns empty array for empty/null queries

### Modifications to Existing

- **Users Table Schema:** Verify username index exists for query performance

### No Changes To

- User profile display from Module 4
- Follow functionality from Module 9
- Authentication from Module 2

## Data Flow

### Search Query Flow

1. **Trigger:** User types in search bar
2. **Debounce Wait:** Wait 300-500ms after last keystroke
3. **Server Action Call:** searchUsers(query) called with search string
4. **Query Validation:** Check query is not empty, trim whitespace
5. **Database Query:** SELECT id, username, profilePictureUrl FROM users WHERE username ILIKE '%query%' ORDER BY username LIMIT 10
6. **Index Usage:** Database uses username index for fast lookup
7. **Conditional Branches:**
    - If matches found → return array of user objects (max 10)
    - If no matches → return empty array
    - If empty query → return empty array
    - If error → return error "Search failed"
8. **Final State:** User results ready for display

## Things to Watch For

**SQL Injection Risk** → Malicious query string breaks or exploits database → Prevention: Use parameterized queries with Drizzle, never concatenate strings into SQL

**Case Sensitivity Issues** → Search for "JOHN" doesn't find "john" → Prevention: Use ILIKE for case-insensitive matching in PostgreSQL

**Missing Username Index** → Queries slow as user base grows → Prevention: Ensure index on users.username, verify with EXPLAIN query

**Empty Query Performance** → Empty string query tries to return all users → Prevention: Check query length > 0 before executing database query

**Whitespace-Only Query** → Query with only spaces returns results → Prevention: Trim query string, check trimmed length > 0

**Special Characters in Query** → Characters like % or _ break ILIKE pattern → Prevention: Escape special characters in query string before ILIKE

**Very Long Query String** → 1000+ character search string → Prevention: Limit query string to reasonable length (e.g., 50 chars)

**Query Performance at Scale** → Slow with 100,000+ users → Prevention: Use indexed search, limit results, test with large dataset

**Exact Match Not First** → Searching "john" should prioritize exact match → Prevention: ORDER BY for exact matches first, then partial: ORDER BY CASE WHEN username = query THEN 0 ELSE 1 END, username

**Result Limit Not Enforced** → Returning 1000 results crashes UI → Prevention: Always LIMIT 10 in query

**Deleted Users in Results** → Soft-deleted users appear → Prevention: MVP uses hard delete, but add WHERE deleted_at IS NULL if implementing soft delete

**Search Includes Current User** → User searches and finds themselves → Prevention: Acceptable per spec, or filter out with WHERE id != currentUserId if desired

**Unicode/International Characters** → Search for "café" doesn't work → Prevention: Ensure database uses UTF-8 collation, test with international usernames

**Leading/Trailing Spaces** → "  john  " doesn't match "john" → Prevention: TRIM query string before search

**Search by Email or Bio** → Users expect to search by email → Prevention: Spec says username only, don't include other fields

**Substring Position Matters** → "ohn" doesn't find "john" at start → Prevention: Use '%query%' pattern for middle matching (already doing this)

**Multiple Word Search** → "john doe" doesn't work well → Prevention: For MVP, search as single string, advanced tokenization out of scope

**Search Result Order Inconsistent** → Same query returns different order → Prevention: Always ORDER BY username for consistent results

**Query Timeout** → Very complex search takes too long → Prevention: Set query timeout, index ensures fast performance

**Null Username** → Database has users with null username → Prevention: Schema should enforce NOT NULL on username, validate in tests

**Empty Results UX** → No indication of no results → Prevention: Handled in UI (Chunk 2), backend returns empty array

**Authentication Not Required** → Anonymous users can search → Prevention: Decide if authentication required, add check if needed

**Rate Limiting Missing** → User spams search queries → Prevention: No rate limiting in MVP, debouncing handles most cases

**Query Logging for Analytics** → No tracking of searches → Prevention: Optional enhancement, log queries server-side for insights

**Search Autocomplete** → Users expect suggestions → Prevention: ILIKE search provides basic autocomplete functionality

**Fuzzy Matching** → Typos don't find results → Prevention: Out of scope for MVP, ILIKE provides basic partial matching

**Search History** → Users can't see past searches → Prevention: Out of scope per Master Spec

**Keyboard Navigation Preview** → Arrow keys to navigate results → Prevention: Handled in UI (Chunk 2)

**Search Analytics** → No metrics on popular searches → Prevention: Out of scope for MVP

**Case Folding for Non-ASCII** → "Café" vs "café" → Prevention: PostgreSQL ILIKE handles basic case folding

**Query Caching** → Same query executed multiple times → Prevention: No caching at query level, acceptable for MVP

**Result Staleness** → Newly registered users don't appear → Prevention: Real-time database query ensures fresh results

## Testing Verification

### Existing Features Still Work

- [ ]  User profiles still load correctly
- [ ]  User authentication still works
- [ ]  Profile navigation still works

### New Functionality Works

- [ ]  searchUsers returns matching users for valid query
- [ ]  Partial match works: "joh" finds "john123"
- [ ]  Case-insensitive works: "JOHN" finds "john"
- [ ]  Results limited to 10 maximum
- [ ]  Results include username and profilePictureUrl
- [ ]  Exact matches prioritized in results
- [ ]  Empty query returns empty array
- [ ]  Whitespace-only query returns empty array

### Edge Cases

- [ ]  Search with special characters (%, _) handled safely
- [ ]  Very long query string (100+ chars) handled
- [ ]  Unicode/emoji in query works correctly
- [ ]  Query "john" with exact match "john" appears first
- [ ]  Search returns results in consistent order
- [ ]  No SQL injection with malicious input
- [ ]  Database uses index for fast queries (verify with EXPLAIN)
- [ ]  Search with 100,000 users still fast (< 100ms)

---

# Chunk 2: 🎨 Search UI with Live Results

Duration: 2-3 hours | Prerequisites: Chunk 1 complete (searchUsers Server Action working, returning results)

## Quick Reference

**Builds:** Search bar with dropdown results, live search with debouncing, keyboard navigation

**Connects:** Search input → Debounced query → searchUsers action → Results dropdown → Profile navigation

**Pattern:** Client component with controlled input, useDebounce hook, keyboard event handling

**Watch For:** Dropdown positioning, click-outside handling, keyboard navigation bugs, mobile UX

## Context

### User Problem

Users need a fast, responsive search interface that shows results instantly as they type with easy navigation.

### From Module Brief

- **Search Bar Location:** Main navigation, always visible
- **Placeholder:** "Search users..."
- **Live Search:** Results appear as user types (debounced 300-500ms)
- **Results Dropdown:** Below search bar, max 10 results
- **Result Display:** Profile picture and username for each
- **Click to Navigate:** Clicking result goes to profile
- **Keyboard Navigation:** Arrow keys navigate, Enter selects, Escape closes
- **Loading State:** Spinner in dropdown during search
- **Empty State:** "No users found" when no results

## What's Changing

### New Additions

- **SearchBar Component:** Client component in main navigation
- **Search Input:** Controlled input with onChange handler
- **Debounce Hook:** Custom hook or library for debouncing queries
- **Results Dropdown:** Absolutely positioned below input, z-index above content
- **Search Result Item:** Component showing profile pic and username
- **Click Outside Handler:** Close dropdown when clicking outside
- **Keyboard Navigation:** Arrow up/down, Enter to select, Escape to close
- **Loading Indicator:** Spinner shown during query
- **Empty State Message:** Displayed when no results

### Modifications to Existing

- **Main Navigation:** Add SearchBar component to header/nav
- **Mobile Navigation:** Ensure search accessible on mobile (bottom bar or header)

### No Changes To

- Search query logic from Chunk 1
- Profile pages from Module 4
- Follow button from Module 9

## Data Flow

### Live Search Flow

1. **Trigger:** User types character in search input
2. **Input Update:** Controlled input updates query state
3. **Debounce Wait:** Wait 300-500ms for user to stop typing
4. **Query Trigger:** After debounce, call searchUsers(query)
5. **Loading State:** Show spinner in dropdown
6. **Results Return:** Server Action returns user array
7. **Conditional Display:**
    - If results exist → Show dropdown with result items
    - If no results → Show "No users found"
    - If empty query → Hide dropdown
8. **Click Result:** User clicks result, navigate to profile, close dropdown
9. **Final State:** Dropdown closed, user on profile page

### Keyboard Navigation Flow

1. **Trigger:** Results dropdown is open
2. **Arrow Down:** Highlight next result in list (circular)
3. **Arrow Up:** Highlight previous result in list (circular)
4. **Enter Key:** Navigate to highlighted result's profile
5. **Escape Key:** Close dropdown, clear highlight
6. **Tab Key:** Close dropdown (natural tab behavior)

## UX Specification

### User Flow

- Trigger: Click search bar or press "/" key (optional hotkey)
- Step 1: Type username partial (e.g., "joh")
- Step 2: After 300ms, see loading spinner
- Step 3: Results dropdown appears with matching users
- Step 4: Use mouse or arrow keys to select result
- Step 5: Click or press Enter to navigate to profile
- Step 6: Dropdown closes, on user profile page

### Empty States

- No search query: Dropdown hidden, placeholder visible
- No results found: "No users found" message in dropdown

### Loading States

- During search query: Spinner/loading indicator in dropdown
- Skeleton items optional (can use simple spinner)

### Error States

- Search query fails: "Search error. Try again." in dropdown
- Network timeout: Same error message

### Responsive Behavior

- Mobile: Search bar full width or in header, dropdown full width below
- Desktop: Search bar natural width in navigation, dropdown matches width
- All sizes: Dropdown not cut off by viewport, scrollable if needed

## Things to Watch For

**Debounce Not Working** → Query fires on every keystroke → Prevention: Use proper debounce hook (useDebouncedValue or custom useDebounce)

**Dropdown Not Visible** → Hidden by z-index issues → Prevention: Set high z-index (e.g., 1000+) on dropdown, positioned relative to parent

**Dropdown Position Wrong** → Appears above input or off-screen → Prevention: Use absolute positioning relative to input container, calculate position

**Click Outside Not Working** → Dropdown doesn't close when clicking away → Prevention: Add event listener to document, check if click target is outside ref

**Input Focus Lost** → Dropdown closes when clicking inside → Prevention: Prevent close on clicks within dropdown container

**Memory Leak** → Event listeners not cleaned up → Prevention: Return cleanup function from useEffect

**Keyboard Navigation Broken** → Arrow keys don't highlight results → Prevention: Track highlighted index in state, update on arrow keys

**Enter Key Submits Form** → Search bar in form submits page → Prevention: preventDefault on Enter key or set type="button" on form

**Escape Key Not Working** → Can't close dropdown with Escape → Prevention: Add keydown listener for Escape, close dropdown and clear input

**Circular Navigation Bug** → Arrow down past last item doesn't go to first → Prevention: Use modulo operator: (index + 1) % results.length

**Highlighted Result Styling** → Not clear which result is selected → Prevention: Add distinct background color/border for highlighted state

**Mobile Keyboard Covers Dropdown** → Results hidden by keyboard → Prevention: Ensure dropdown scrolls into view, or position above input if needed

**Search Input Not Clearing** → Query stays after navigation → Prevention: Clear input state after navigating to profile

**Multiple Simultaneous Searches** → Rapid typing causes race conditions → Prevention: Cancel previous search when new one starts, or use query ID

**Dropdown Scrolling** → More than 10 results try to display → Prevention: Backend limits to 10, but set max-height and overflow-y: auto

**Profile Picture Broken** → Missing images in results → Prevention: Show default avatar when profilePictureUrl is null

**Username Truncation** → Long usernames overflow → Prevention: Set max-width with ellipsis overflow

**Hover vs Keyboard Highlight** → Mouse hover conflicts with keyboard selection → Prevention: Mouse hover updates highlight state, keyboard uses same state

**Tab Key Behavior** → Tab closes dropdown unexpectedly → Prevention: Acceptable behavior, or prevent default and handle manually

**Search on Enter** → User expects Enter to search, not navigate → Prevention: If no result highlighted, Enter could trigger search, else navigate to highlighted

**Mobile Tap Delay** → Slow response on mobile → Prevention: Use touchstart or optimize for mobile events

**Dropdown Flicker** → Appears and disappears rapidly → Prevention: Debounce dropdown visibility, minimum display time

**Input Placeholder Style** → Not consistent with app → Prevention: Style placeholder to match app design

**Loading Indicator Position** → Spinner not centered → Prevention: Center spinner in dropdown with flexbox

**Empty State Not Friendly** → "No results" is boring → Prevention: Add helpful message: "No users found. Try a different username."

**Search History Interference** → Browser autocomplete conflicts → Prevention: Set autoComplete="off" on input

**Dropdown Width Mismatch** → Dropdown wider or narrower than input → Prevention: Set dropdown width to match input width explicitly

**Z-Index Conflicts** → Other elements appear over dropdown → Prevention: Use high z-index and verify in testing with all page elements

**Focus Management** → After navigation, focus not managed → Prevention: Not critical, but could blur input or return focus to main content

**Accessibility Missing** → Screen readers can't use search → Prevention: Add ARIA labels, role="combobox", aria-expanded, aria-activedescendant

**Keyboard Shortcuts Missing** → No hotkey to open search → Prevention: Optional: Add "/" key listener to focus search input

**No Visual Feedback** → Typing doesn't show activity → Prevention: Loading spinner and results provide feedback

**Dropdown Animation Jarring** → Abrupt appearance → Prevention: Add fade-in CSS transition for smooth appearance

## Testing Verification

### Existing Features Still Work

- [ ]  Navigation still works
- [ ]  Profile pages still load
- [ ]  All other features unaffected

### New Functionality Works

- [ ]  Search bar visible in navigation
- [ ]  Placeholder text "Search users..." shows
- [ ]  Typing updates input value
- [ ]  After 300-500ms, search query fires
- [ ]  Loading spinner shows during query
- [ ]  Results dropdown appears with matches
- [ ]  Each result shows profile picture and username
- [ ]  Clicking result navigates to profile
- [ ]  Dropdown closes after navigation
- [ ]  Empty query shows no dropdown
- [ ]  No results shows "No users found"

### Edge Cases

- [ ]  Arrow down highlights next result
- [ ]  Arrow up highlights previous result
- [ ]  Arrow down from last result goes to first (circular)
- [ ]  Enter key navigates to highlighted result
- [ ]  Escape key closes dropdown
- [ ]  Clicking outside closes dropdown
- [ ]  Clicking inside dropdown doesn't close it
- [ ]  Mobile keyboard doesn't hide results
- [ ]  Long username truncates with ellipsis
- [ ]  Missing profile pictures show default avatar
- [ ]  Rapid typing doesn't break search
- [ ]  Search bar accessible with keyboard
- [ ]  Screen reader can navigate results

---

## Feature Acceptance Tests

**Run these after both chunks are complete:**

### Core Tests (from Module Brief)

- [ ]  Type "joh" in search bar → Results appear showing users with "joh" in username
- [ ]  Type "JOHN" → Results appear (case-insensitive)
- [ ]  Click on search result → Navigate to that user's profile
- [ ]  Search for non-existent username → "No users found" shown
- [ ]  Clear search bar → Dropdown closes

### Edge Cases (from Module Brief)

- [ ]  Search for single character → Results appear
- [ ]  Search with special characters (@, #, etc) → No errors, safe query
- [ ]  Type very fast → Only last query is searched (debouncing works)
- [ ]  Search returns 15 matches → Only 10 displayed
- [ ]  Exact match "john" with many partials → Exact match appears first

### Integration Tests

- [ ]  Search for user → navigate to profile → follow button works
- [ ]  Search on mobile → dropdown displays correctly
- [ ]  Search with keyboard only → fully functional
- [ ]  Search with screen reader → accessible

---

## Implementation Notes

**Debouncing Pattern:**

```tsx
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery.trim()) {
    searchUsers(debouncedQuery);
  }
}, [debouncedQuery]);
```

**Keyboard Navigation Pattern:**

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    setHighlightedIndex(prev => (prev + 1) % results.length);
  } else if (e.key === 'ArrowUp') {
    setHighlightedIndex(prev => (prev - 1 + results.length) % results.length);
  } else if (e.key === 'Enter' && highlightedIndex >= 0) {
    navigateToProfile(results[highlightedIndex]);
  } else if (e.key === 'Escape') {
    closeDropdown();
  }
};
```

**Performance Considerations:**

- Debounce prevents excessive queries
- Database index ensures fast lookups
- Limit results to 10 keeps UI responsive
- Simple ILIKE query is fast enough for MVP

**Accessibility Checklist:**

- [ ]  Search input has label or aria-label
- [ ]  role="combobox" on input
- [ ]  aria-expanded indicates dropdown state
- [ ]  aria-activedescendant points to highlighted result
- [ ]  Results have appropriate ARIA roles
- [ ]  Keyboard navigation fully functional

**Security Checklist:**

- [ ]  Query uses parameterized SQL
- [ ]  Special characters escaped
- [ ]  No SQL injection possible
- [ ]  No XSS via display of usernames