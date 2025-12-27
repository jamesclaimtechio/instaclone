# Architecture

## System Overview

Instagram Clone is a **full-stack monolithic application** built with Next.js App Router. The architecture prioritizes simplicity and developer velocity over microservices complexity. Server Components handle data fetching and rendering, while Client Components manage interactivity with optimistic UI patterns. Authentication uses JWT tokens in HTTP-only cookies. Images are processed server-side and stored in Cloudflare R2. All data lives in a single Neon Postgres database accessed via Drizzle ORM.

**Why monolithic?** For an MVP with standard CRUD operations and no complex scaling requirements, a monolith provides the fastest path to production. Server Actions eliminate the need for separate API layer in most cases. Deployment to Vercel is zero-config.

**Why Drizzle over Prisma?** TypeScript-native schema means no codegen step, better AI code generation, and instant type inference. Schema changes are migrations, not regeneration steps.

---

## Key Patterns

### Optimistic UI with React 19

**What:** All social actions (likes, comments, follows) update the UI immediately before server confirmation using React 19's `useOptimistic` hook.

**Why:** Instagram-like apps require instant feedback. Users expect hearts to fill immediately on click, comments to appear instantly. Waiting for server response creates perceived lag and poor UX.

**Where:** LikeButton component, CommentForm component, FollowButton component. Every mutation that affects social engagement metrics.

**Rollback:** When Server Action fails, `useOptimistic` automatically rolls back to previous state. Show toast notification to inform user of failure.

### Server Components by Default

**What:** Pages and components are Server Components unless they need client-side interactivity.

**Why:** Reduces JavaScript bundle sent to client, improves initial page load, enables direct database queries without API layer.

**Where:** Feed page, profile page, post permalink page, navigation chrome. Only forms, buttons with onClick, and optimistic UI components are Client Components.

**Exception:** When component needs `useState`, `useOptimistic`, or event handlers, mark as Client Component with 'use client' directive.

### Server Actions Over API Routes

**What:** Data mutations (posts, likes, comments, auth) use Server Actions instead of separate API route handlers.

**Why:** Collocated with component code, no need to define separate API routes, automatic request deduplication, progressive enhancement support.

**Where:** app/actions/ directory. Organized by feature: auth.ts, posts.ts, comments.ts, follows.ts.

**Security:** Every Server Action must call `getCurrentUser()` to verify authentication before processing. Never trust client state.

### Three-Size Image Pipeline

**What:** Every uploaded image generates three versions: thumbnail (400px), full-size (1200px), and blur placeholder (20px base64).

**Why:** Thumbnails keep feed fast, full-size for detail view, blur placeholder prevents layout shift during load.

**Where:** Image upload Server Action. Sharp library handles resize and compression. All three uploaded to R2 with predictable paths.

**Flow:** User uploads → Sharp processes → 3 versions generated → Upload to R2 → Store URLs in database → Return to client.

### Global Chronological Feed

**What:** Feed shows ALL posts from ALL users, sorted by creation date descending (newest first). No algorithmic ranking, no filtering by follows.

**Why:** Simplifies MVP implementation. Follow system exists for counts and future feature expansion, but feed remains global.

**Where:** Feed page query. Simple ORDER BY createdAt DESC with pagination.

**Pagination:** Cursor-based using createdAt timestamp to avoid skipping posts when new content added.

### Flat Comment Threading

**What:** All comments on a post are at the same level. No nested replies.

**Why:** Master spec explicitly forbids nested replies. Keeps data model simple, UI straightforward.

**Where:** Comments display on post permalink. Sorted newest first (DESC).

**Deletion:** Comment author, post author, or admin can delete. Show confirmation dialog.

### Cascade Deletion Strategy

**What:** When post deleted, all likes and comments cascade delete. When user deleted, all their content cascades.

**Why:** Maintains referential integrity. No orphaned data. Simple cleanup.

**Where:** Database foreign key constraints configured with ON DELETE CASCADE. Post deletion → likes + comments deleted. User deletion → posts + comments + likes + follows deleted.

**Admin:** Admin dashboard allows deletion of any entity. All deletions are permanent (hard delete, no soft delete).

---

## Data Flow

### User Registration Flow

1. User submits registration form (email, password, username)
2. Server Action validates uniqueness (email and username)
3. Password hashed with bcrypt (cost 12)
4. User record created with emailVerified=false
5. 6-digit OTP generated and stored with 15-minute expiration
6. Email sent via Resend with OTP code
7. User enters OTP on verification page
8. Server Action validates OTP (code match, not expired, belongs to user)
9. emailVerified set to true, OTP record deleted
10. User redirected to feed with full access

**Unverified state:** User can browse feed and profiles but cannot post, like, or comment until verified.

### Post Creation Flow

1. User selects image file and enters caption
2. FormData sent to Server Action
3. Server Action validates authentication and email verification
4. Image file validated (type, size max 50MB)
5. Sharp processes image into 3 sizes: thumbnail, full-size, blur placeholder
6. All 3 versions uploaded to R2 in parallel
7. Post record created in database with image URLs and blur hash
8. revalidatePath called to refresh feed
9. User redirected to feed, new post appears at top

**Failure handling:** If R2 upload fails, show error and do not create post record. If database insert fails after R2 upload, orphaned images remain (acceptable for MVP).

### Like Action Flow (Optimistic)

1. User clicks heart icon on post
2. `useOptimistic` immediately fills heart and increments count in UI
3. Server Action called to create like record
4. Server validates authentication, checks not already liked
5. Like record inserted (postId, userId composite unique constraint)
6. Server Action returns success
7. UI update confirmed (already displayed)

**Failure:** If Server Action fails, `useOptimistic` rolls back UI (heart empties, count decrements). Toast notification shown.

### Feed Load Flow

1. User navigates to feed page (Server Component)
2. Server queries database for posts (ORDER BY createdAt DESC, LIMIT 30)
3. For each post, LEFT JOIN users for author info
4. For each post, COUNT likes and comments
5. Check if current user has liked each post
6. Posts rendered with skeleton loaders first, then data
7. Images load with blur placeholder until full image ready

**Pagination:** "Load More" button or infinite scroll loads next batch with cursor (last post's createdAt timestamp).

### Comment Creation Flow (Optimistic)

1. User types comment and clicks Post
2. `useOptimistic` immediately adds comment to list
3. Server Action called with postId and comment text
4. Server validates authentication, email verification, non-empty text
5. Comment record created (postId, userId, text)
6. Server Action returns created comment with author info
7. Optimistic comment replaced with real comment (has database ID)

**Failure:** If Server Action fails, optimistic comment removed from list, toast shown.

---

## External Services

### Neon Postgres

**Purpose:** Primary database for all application data

**Integration:** Direct connection via Postgres connection string. Drizzle ORM handles queries.

**Fallback:** None. Database is critical path. If Neon is down, app is down. Display generic error to users.

**Features Used:** Serverless Postgres, instant provisioning, database branching for dev/staging.

### Cloudflare R2

**Purpose:** Image storage with global CDN delivery

**Integration:** S3-compatible API via AWS SDK. Upload all image variants after Sharp processing.

**Fallback:** If R2 upload fails, do not create post/update profile. Show error to user with retry option.

**Features Used:** Public read access on bucket, zero egress fees, S3-compatible API.

**Configuration:** Bucket requires public read for image URLs to work. Upload requires authentication (credentials server-side only).

### Resend

**Purpose:** Transactional email delivery (OTP codes, password reset)

**Integration:** REST API with API key authentication. Simple JSON requests.

**Fallback:** If email send fails, log error but show success to user ("Check your email"). Queue retry. Never expose email service failure to prevent enumeration attacks.

**Features Used:** Send endpoint for transactional emails. From address must be verified domain.

### Vercel

**Purpose:** Hosting and deployment platform

**Integration:** Git push to main branch triggers automatic deployment. Environment variables set in Vercel dashboard.

**Fallback:** Not applicable. Deployment platform, not runtime dependency.

**Features Used:** Zero-config Next.js deployments, automatic HTTPS, environment variable management, preview deployments.

---

## Security Model

### Authentication

**Mechanism:** JWT tokens stored in HTTP-only, secure, sameSite=strict cookies.

**Token Contents:** User ID, isAdmin flag, expiration (30 days from issue).

**Validation:** Middleware checks JWT signature and expiration on every protected route. Invalid token redirects to login.

**Session Duration:** 30 days. No refresh tokens in MVP.

**Password Security:** All passwords hashed with bcrypt cost factor 12 before storage. Never store plaintext.

### Authorization

**Protected Actions:**

- Creating posts: Requires authentication + email verification
- Liking posts: Requires authentication + email verification
- Commenting: Requires authentication + email verification
- Following: Requires authentication + email verification
- Deleting posts: Requires ownership OR admin flag
- Deleting comments: Requires ownership OR post ownership OR admin flag
- Admin dashboard: Requires admin flag

**Enforcement:** Every Server Action calls `getCurrentUser()` to get authenticated user. Ownership checks before mutations. Never trust client state.

### Data Protection

**IDOR Prevention:** All queries filtered by userId for user-specific data. No fetching other users' private data.

**SQL Injection:** Drizzle ORM uses parameterized queries. No string concatenation in queries.

**XSS Prevention:** React escapes user content by default. Never use dangerouslySetInnerHTML with user input.

**CSRF:** Next.js Server Actions have built-in CSRF protection (verify enabled).

**Secrets:** All sensitive values (database URL, R2 credentials, JWT secret, API keys) in environment variables, never in code.

### Email Verification

**Purpose:** Prevent spam accounts, verify email ownership

**Mechanism:** 6-digit numeric OTP sent to email after registration. 15-minute expiration.

**Rate Limiting:** Max 5 OTP verification attempts per 15 minutes per user. Max 3 OTP resend requests per hour.

**Before Verification:** User can browse feed and profiles (read-only) but cannot post, like, or comment.

**After Verification:** emailVerified flag set to true. Full access granted. OTP record deleted.

---

## Performance Strategy

### Database Optimization

**Indexes:** username (unique), email (unique), posts.userId, posts.createdAt (for feed sorting), likes composite (postId, userId), follows composite (followerId, followingId).

**Query Patterns:** Use Drizzle's relational queries to minimize N+1 problems. LEFT JOIN users for author info in single query.

**Connection Pooling:** Neon handles pooling automatically. No manual pool management needed.

**Pagination:** Cursor-based pagination using createdAt timestamp. Avoids offset-based skipping issues when new posts added.

### Image Delivery

**Multiple Sizes:** Serve thumbnail in feed (400px), full-size on permalink (1200px). Browser automatically picks right size.

**Compression:** Sharp compresses images (quality 80 for thumbnails, 85 for full-size). Reduces bandwidth.

**CDN:** R2 automatically serves via Cloudflare's global CDN. Images cached at edge.

**Blur Placeholder:** 20px base64-encoded blur shown during image load. Prevents layout shift, improves perceived performance.

**Lazy Loading:** Use native loading="lazy" attribute on images below fold.

### Bundle Optimization

**Server Components:** Default to Server Components reduces client bundle. Only interactive components sent to client.

**Code Splitting:** Next.js automatically code splits by route. Dynamic imports for rarely-used components.

**Minimal Dependencies:** Use shadcn/ui (copy-paste, no runtime dependency) instead of full component library.

**Tree Shaking:** Next.js and Vercel automatically tree shake unused code.

### Caching Strategy

**Static Generation:** None in MVP (all dynamic content). Future: Static generation for public profiles.

**Server Cache:** None in MVP. Database queries execute on every request.

**Client Cache:** React's built-in cache for Server Component data. No manual cache management.

**Revalidation:** `revalidatePath('/feed')` called after post creation to refresh feed. `revalidatePath('/profile/[username]')` after profile updates.

---

## Why These Choices?

### Monolith Over Microservices

Microservices add complexity (service discovery, inter-service communication, distributed transactions) without providing value at MVP scale. Monolith is simpler, faster to develop, easier to debug, and sufficient until 100K+ users.

### Server Actions Over REST API

Separate API routes require defining endpoints, handling CORS, managing state between client and server. Server Actions collocate logic with UI, reduce boilerplate, provide type safety, and work with progressive enhancement.

### R2 Over S3

R2 is S3-compatible but has **zero egress fees**. For image-heavy app, egress costs dominate AWS S3 bill. R2 eliminates this cost while providing same API.

### Drizzle Over Prisma

Drizzle's TypeScript-native schema means AI can generate it reliably (no DSL to hallucinate). No codegen step means faster iteration. Migrations are pure SQL (reviewable, predictable). Type inference is instant.

### Custom Auth Over NextAuth

Learning project. Building auth manually teaches fundamentals (JWT, bcrypt, cookies, middleware). NextAuth abstracts too much for educational goals.

### Global Feed Over Filtered

Filtered feed ("show only posts from followed users") requires complex queries (JOIN follows, filter posts) and degrades performance. Global feed is simple `SELECT * FROM posts ORDER BY createdAt DESC`. Follow system still valuable for future features.