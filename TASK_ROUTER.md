# Task Router

Quick navigation: What are you trying to do? Where to look.

---

## Database Tasks

### Add a new model/table

**Read:** DATABASE_SCHEMA (for conventions and constraints)

**Watch for:** Remember schema has EXACTLY 6 tables. No new tables allowed. Check constraints section first.

### Query with relations

**Read:** DATABASE_SCHEMA (relationship diagram)

**Watch for:** N+1 queries. Use Drizzle's relational queries with LEFT JOIN. Always include author info in single query.

### Add a field to existing table

**Read:** DATABASE_SCHEMA (check constraints section first)

**Watch for:** Do not add "future" fields. Only add what's in Master Spec. Migration needed: `pnpm db:generate` then `pnpm db:migrate`.

### Optimize slow query

**Read:** DATABASE_SCHEMA (Performance Targets section)

**Watch for:** Check indexes exist. Run EXPLAIN ANALYZE. Feed query with 30 posts should be <100ms.

---

## API Integration Tasks

### Upload image to R2

**Read:** API_CONTRACTS > Cloudflare R2 section

**Watch for:** Must generate 3 sizes (thumbnail, full, blur). Use Sharp for processing. Validate file type and size before upload.

### Send email via Resend

**Read:** API_CONTRACTS > Resend section

**Watch for:** Include both HTML and plain text. Never expose email failures to users (security). From address must use verified domain.

### Handle R2 upload failure

**Read:** API_CONTRACTS > Cloudflare R2 > Error Handling

**Watch for:** Retry up to 3 times. Show generic error to user. Log details server-side.

---

## Authentication Tasks

### Add protected route

**Read:** ARCHITECTURE > Security Model, .cursorrules > Security Rules

**Watch for:** Middleware must cover route. Every Server Action must call getCurrentUser(). Never trust client state.

### Check user permissions

**Read:** ARCHITECTURE > Security Model > Authorization

**Watch for:** Always filter by userId. Verify ownership before mutations. Check isAdmin flag for admin actions.

### Implement email verification

**Read:** MODULE 3 documentation

**Watch for:** OTP expires in 15 minutes. Max 5 attempts per 15 min. Unverified users can view but not post/like/comment.

### Add JWT authentication

**Read:** ARCHITECTURE > Security Model > Authentication

**Watch for:** Use HTTP-only cookies, NOT localStorage. JWT must include userId and isAdmin. Secret must be 32+ bytes.

---

## Image Processing Tasks

### Resize and compress image

**Read:** .cursorrules #6, ARCHITECTURE > Key Patterns > Three-Size Image Pipeline

**Watch for:** ALWAYS generate 3 versions: thumbnail (400px), full (1200px), blur placeholder (20px base64). Use Sharp library.

### Handle image upload

**Read:** MODULE 5 documentation

**Watch for:** Validate file type (image/*) and size (max 50MB). Process with Sharp before R2 upload. Generate blur hash.

### Display images with blur placeholder

**Read:** ARCHITECTURE > Performance Strategy > Image Delivery

**Watch for:** Show blur placeholder during load. Use thumbnailUrl in feed, imageUrl on permalink. Lazy load below fold.

---

## UI/UX Tasks

### Create new page

**Read:** .cursorrules > File Organisation

**Watch for:** Server Component by default. Only use Client Component if needs useState, useOptimistic, or event handlers.

### Add form with validation

**Read:** .cursorrules > Security Rules > Input Validation

**Watch for:** Validate on BOTH client AND server. Server validation is security boundary. Client validation is UX only.

### Implement optimistic UI

**Read:** ARCHITECTURE > Key Patterns > Optimistic UI with React 19, .cursorrules #3-4

**Watch for:** MUST use React 19's useOptimistic hook. Immediate UI update, automatic rollback on error. Show toast on failure.

### Make component responsive

**Read:** MODULE 13 documentation

**Watch for:** Mobile-first design. Min 44px tap targets. Bottom nav on mobile, top nav on desktop. Test on actual devices.

---

## Social Feature Tasks

### Add like button

**Read:** MODULE 7 documentation

**Watch for:** Optimistic UI required. Toggle behavior (like/unlike). Unique constraint prevents duplicates. Handle rollback.

### Add comment system

**Read:** MODULE 8 documentation

**Watch for:** Flat threading only (no nested replies). Newest first. Min 1 char validation. Post author can delete any comment.

### Add follow button

**Read:** MODULE 9 documentation

**Watch for:** Optimistic UI required. User cannot follow themselves. Counts update immediately. No follower/following lists (counts only).

### Implement user search

**Read:** MODULE 10 documentation

**Watch for:** Username-only search with ILIKE. Max 10 results. Case-insensitive. Index required on username.

---

## Feed & Posts Tasks

### Build global feed

**Read:** ARCHITECTURE > Key Patterns > Global Chronological Feed, MODULE 6 documentation

**Watch for:** Show ALL posts from ALL users. ORDER BY createdAt DESC. Cursor-based pagination (not offset). No filtering by follows.

### Create post

**Read:** MODULE 6 documentation

**Watch for:** Image upload required. Caption optional (no length limit). Check email verification before allowing post.

### Delete post

**Read:** .cursorrules #13, DATABASE_SCHEMA > Cascade Delete

**Watch for:** Cascade deletes likes AND comments. Only post author or admin can delete. Show confirmation dialog.

### Paginate feed

**Read:** ARCHITECTURE > Performance Strategy > Database Optimization

**Watch for:** Cursor-based, not offset-based. Use createdAt as cursor. Prevents skipping posts when new content added.

---

## Admin Dashboard Tasks

### Protect admin routes

**Read:** .cursorrules #14, MODULE 11 documentation

**Watch for:** Middleware checks isAdmin flag. Every admin Server Action must verify isAdmin. Non-admin gets "Access denied".

### Implement cascade delete

**Read:** DATABASE_SCHEMA > Cascade Delete, ARCHITECTURE > Key Patterns > Cascade Deletion

**Watch for:** Foreign keys configured with ON DELETE CASCADE. User deletion cascades to ALL content. Test thoroughly.

### Build admin moderation

**Read:** MODULE 11 documentation

**Watch for:** Admin can delete ANY user/post/comment. Show confirmation dialogs. All deletions permanent (hard delete).

---

## Performance Tasks

### Optimize database queries

**Read:** DATABASE_SCHEMA > Performance Targets, ARCHITECTURE > Performance Strategy

**Watch for:** Use Drizzle relational queries. Avoid N+1 problems. Check indexes exist. Run EXPLAIN ANALYZE.

### Reduce bundle size

**Read:** ARCHITECTURE > Performance Strategy > Bundle Optimization

**Watch for:** Default to Server Components. Dynamic imports for heavy components. Use shadcn/ui (copy-paste, no runtime dep).

### Implement lazy loading

**Read:** ARCHITECTURE > Performance Strategy > Image Delivery

**Watch for:** Use loading="lazy" on images. Blur placeholders prevent layout shift. Thumbnails in feed, full-size on permalink.

---

## Error Handling Tasks

### Add error boundaries

**Read:** .cursorrules > Security Rules > Error Handling

**Watch for:** Never expose stack traces in production. Show generic messages to users. Log detailed errors server-side.

### Handle network errors

**Read:** TROUBLESHOOTING for specific errors

**Watch for:** Retry with exponential backoff. Show user-friendly messages. Optimistic UI rollback on failure.

### Validate user input

**Read:** .cursorrules > Security Rules > Input Validation

**Watch for:** Server-side validation is security boundary. Sanitize all inputs. Drizzle parameterized queries prevent SQL injection.

---

## Deployment Tasks

### Setup environment variables

**Read:** ENV_SETUP (complete setup instructions)

**Watch for:** Different secrets for dev and prod. JWT secret must be 32+ bytes. Never commit .env.local to git.

### Deploy to Vercel

**Read:** ENV_SETUP > Environment-Specific Settings > Production

**Watch for:** Set all env vars in Vercel dashboard. Use production database, not dev. Test R2 credentials work.

### Debug production errors

**Read:** TROUBLESHOOTING > Deployment Issues

**Watch for:** Check Vercel Functions logs for details. Verify all env vars set correctly. Test database connection.

---

## Common Patterns

### Server Action with auth check

**Read:** .cursorrules #17, ARCHITECTURE > Security Model

**Pattern:**

1. Call getCurrentUser() to verify authentication
2. Check emailVerified if required
3. Verify ownership or isAdmin for mutations
4. Execute operation
5. Return result or error

**Watch for:** Always check auth. Never trust client state. Handle all errors with try-catch.

### Optimistic UI pattern

**Read:** ARCHITECTURE > Key Patterns > Optimistic UI

**Pattern:**

1. Use useOptimistic to wrap state
2. Update UI immediately
3. Call Server Action
4. On success: UI already updated
5. On error: Automatic rollback, show toast

**Watch for:** Must use React 19 useOptimistic. Component must be Client Component. Handle errors properly.

### Image upload pattern

**Read:** ARCHITECTURE > Key Patterns > Three-Size Image Pipeline

**Pattern:**

1. Validate file (type, size)
2. Process with Sharp (3 sizes)
3. Upload all to R2 in parallel
4. Store URLs in database
5. Return image data

**Watch for:** Always generate 3 sizes. Validate before processing. Handle R2 errors gracefully.

---

## Quick Reference

**Need to:**

- Add database field → DATABASE_SCHEMA constraints first
- Integrate external API → API_CONTRACTS for that service
- Fix an error → TROUBLESHOOTING for specific error
- Setup project → QUICK_START for step-by-step
- Understand architecture → ARCHITECTURE for patterns and rationale
- Know what NOT to do → .cursorrules for critical rules

**Remember:**

- Database has EXACTLY 6 tables (no more)
- Feed is GLOBAL (not filtered by follows)
- Comments are FLAT (no nested replies)
- Username is PERMANENT (cannot change)
- Optimistic UI is MANDATORY for social actions
- JWT in HTTP-only cookies (NOT localStorage)