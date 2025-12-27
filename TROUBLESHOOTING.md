# Troubleshooting

## Database Issues

### "Connection to database failed"

**Cause:** Invalid DATABASE_URL, network issues, or Neon service down

**Fix:**

1. Verify DATABASE_URL in .env.local is correct
2. Check Neon dashboard - project may be paused (free tier auto-pauses)
3. Test connection: `psql $DATABASE_URL`
4. Check Neon status: https://neonstatus.com

**See:** ENV_SETUP for connection string format

---

### "Drizzle migration failed"

**Cause:** Schema change conflicts with existing data, or migration syntax error

**Fix:**

1. Check migration SQL in `src/db/migrations/` for syntax errors
2. If development, drop database and re-run migrations from scratch
3. If production, review migration carefully, may need manual fix
4. Run `pnpm drizzle-kit push` to verify schema changes

**See:** DATABASE_SCHEMA for correct schema structure

---

### "Unique constraint violation on username"

**Cause:** Attempted to create user with existing username

**Fix:** This is expected behavior. Show user-friendly error: "Username already taken. Please choose another."

**See:** .cursorrules #9 - Username is PERMANENT and unique

---

### "Foreign key constraint violation"

**Cause:** Trying to create post/comment/like referencing non-existent user or post

**Fix:**

1. Verify userId/postId exists before insert
2. Check cascade delete configuration (ON DELETE CASCADE)
3. Review query logic - may be race condition

**See:** DATABASE_SCHEMA for cascade delete rules

---

## R2 / Image Upload Issues

### "R2 upload failed: NoSuchBucket"

**Cause:** R2_BUCKET_NAME doesn't match actual bucket name

**Fix:**

1. Check R2_BUCKET_NAME in .env.local
2. Verify bucket exists in Cloudflare R2 dashboard
3. Check for typos (bucket names are case-sensitive)

**See:** ENV_SETUP for R2 configuration

---

### "R2 upload failed: AccessDenied"

**Cause:** Invalid R2 credentials or insufficient permissions

**Fix:**

1. Verify R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY
2. Check API token has "Object Read & Write" permissions
3. Regenerate API token if unsure
4. Verify R2_ACCOUNT_ID is correct

**See:** API_CONTRACTS > Cloudflare R2 > Authentication

---

### "Uploaded images not displaying"

**Cause:** R2 bucket not configured for public read, or wrong public URL

**Fix:**

1. Enable public read access on R2 bucket
2. Verify R2_PUBLIC_URL is correct
3. Check browser console for CORS errors
4. Test image URL directly in browser

**See:** API_CONTRACTS > Cloudflare R2 > Configuration

---

### "Sharp image processing failed"

**Cause:** Corrupted image file, unsupported format, or Sharp not installed

**Fix:**

1. Verify file is valid image (open in image viewer)
2. Check file type validation before processing
3. Reinstall Sharp: `pnpm add sharp`
4. On production, ensure Sharp is in dependencies, not devDependencies

**See:** .cursorrules #6 - All images must go through Sharp pipeline

---

## Authentication Issues

### "JWT verification failed"

**Cause:** Invalid JWT secret, expired token, or token tampering

**Fix:**

1. Verify JWT_SECRET is set in .env.local
2. Clear cookies and login again
3. Check JWT_EXPIRES_IN (default 30 days)
4. Ensure JWT_SECRET is same across deployments

**See:** ARCHITECTURE > Security Model > Authentication

---

### "User not authenticated after login"

**Cause:** Cookie not being set or middleware not checking correctly

**Fix:**

1. Check browser dev tools > Application > Cookies - JWT cookie should be present
2. Verify cookie is httpOnly and secure flags set
3. Check middleware is configured for protected routes
4. Ensure Server Action is calling `cookies().set()` correctly

**See:** .cursorrules #16 - JWT in HTTP-only cookies

---

### "Email verification required" but user is verified

**Cause:** emailVerified flag check failing or stale data

**Fix:**

1. Check users table - verify emailVerified=true in database
2. Clear cookies and re-login
3. Verify getCurrentUser() returns correct emailVerified status
4. Check Server Action is checking emailVerified before allowing posts

**See:** .cursorrules #10 - Email verification blocks posting, not viewing

---

## Email Issues

### "OTP email not received"

**Cause:** Email sent to spam, Resend API failure, or wrong email address

**Fix:**

1. Check spam/junk folder
2. Verify RESEND_API_KEY is correct
3. Check Resend dashboard > Logs for delivery status
4. Verify RESEND_FROM_EMAIL uses verified domain
5. Test with different email provider (Gmail, Outlook)

**See:** API_CONTRACTS > Resend > Troubleshooting

---

### "Email send failed: validation_error"

**Cause:** Invalid from address (domain not verified) or malformed request

**Fix:**

1. Verify domain in Resend dashboard
2. Check DNS records (SPF, DKIM, DMARC) are configured
3. Verify RESEND_FROM_EMAIL format: [noreply@yourdomain.com](mailto:noreply@yourdomain.com)
4. Check email template has both HTML and text versions

**See:** ENV_SETUP > Resend Email > Domain Setup

---

### "OTP code always invalid"

**Cause:** Code mismatch, expired, or timezone issue

**Fix:**

1. Check otp_codes table - verify code exists and matches
2. Check expiresAt timestamp - may have expired
3. Verify server timezone matches database timezone
4. Add logging to OTP validation logic
5. Check for whitespace in input (trim before comparing)

**See:** DATABASE_SCHEMA > otp_codes table

---

## Optimistic UI Issues

### "UI doesn't roll back on error"

**Cause:** useOptimistic not configured correctly or error not thrown

**Fix:**

1. Verify Server Action throws error on failure
2. Check useOptimistic hook is wrapping correct state
3. Ensure error boundary catches Server Action errors
4. Add console.log to verify rollback triggers

**See:** ARCHITECTURE > Key Patterns > Optimistic UI

---

### "Like count goes negative"

**Cause:** Optimistic update math error or race condition

**Fix:**

1. Add guard: `Math.max(0, count - 1)` when decrementing
2. Check duplicate like/unlike requests aren't firing
3. Verify database constraint prevents duplicate likes
4. Reload data from server to reset

**See:** .cursorrules #13 - No negative counts

---

### "Double-clicking like causes issues"

**Cause:** Multiple rapid requests racing

**Fix:**

1. Add debounce to like button (300ms)
2. Disable button during Server Action
3. Check database for duplicate like entries
4. Use unique constraint to prevent duplicates

**See:** DATABASE_SCHEMA > likes table > Constraints

---

## Feed & Performance Issues

### "Feed loads very slowly"

**Cause:** Missing indexes, N+1 queries, or too many posts

**Fix:**

1. Check database indexes exist (run EXPLAIN ANALYZE)
2. Verify using Drizzle relational queries (not separate queries per post)
3. Reduce posts per page (default 30)
4. Add pagination cursor optimization

**See:** DATABASE_SCHEMA > Performance Targets

---

### "Images load slowly"

**Cause:** Not using thumbnails, no blur placeholder, or CDN issue

**Fix:**

1. Verify thumbnailUrl (400px) used in feed, not imageUrl (1200px)
2. Check blurHash is displaying during load
3. Test R2 CDN speed (should be <100ms globally)
4. Optimize Sharp compression settings

**See:** ARCHITECTURE > Performance Strategy > Image Delivery

---

### "Pagination skips posts"

**Cause:** Using offset pagination while new posts added

**Fix:**

1. Switch to cursor-based pagination
2. Use createdAt timestamp as cursor
3. Query: WHERE createdAt < $cursor ORDER BY createdAt DESC

**See:** ARCHITECTURE > Key Patterns > Global Chronological Feed

---

## Deployment Issues

### "Vercel build fails"

**Cause:** Missing environment variables, TypeScript errors, or dependency issues

**Fix:**

1. Check Vercel build logs for specific error
2. Verify all environment variables set in Vercel dashboard
3. Run `pnpm build` locally to reproduce
4. Check TypeScript errors: `pnpm tsc --noEmit`
5. Verify all dependencies in package.json

**See:** ENV_SETUP > Environment-Specific Settings > Production

---

### "Production app shows 500 errors"

**Cause:** Missing env vars, database connection, or R2 credentials

**Fix:**

1. Check Vercel > Functions > Logs for error details
2. Verify DATABASE_URL is production database, not dev
3. Check R2 credentials are production credentials
4. Test each environment variable is set correctly

**See:** ENV_SETUP > Troubleshooting

---

### "Images upload locally but not in production"

**Cause:** R2 credentials not set in Vercel or wrong bucket

**Fix:**

1. Verify R2_* environment variables in Vercel
2. Check production R2 bucket exists and has public read
3. Test R2 credentials in Vercel Functions logs
4. Verify Sharp works in serverless environment

**See:** API_CONTRACTS > Cloudflare R2

---

## Admin Dashboard Issues

### "Non-admin can access /admin"

**Cause:** Middleware not checking isAdmin or check bypassed

**Fix:**

1. Verify middleware covers /admin/* routes
2. Check getCurrentUser() returns isAdmin correctly
3. Add isAdmin check in every admin Server Action
4. Test with non-admin user account

**See:** .cursorrules #14 - Admin can delete ANYTHING

---

### "Cascade delete not working"

**Cause:** Foreign keys missing ON DELETE CASCADE

**Fix:**

1. Check Drizzle schema - all foreign keys should have `onDelete: 'cascade'`
2. Run migration to add CASCADE if missing
3. Test by deleting user with posts - all posts should delete
4. Check database constraints directly: `\d+ posts` in psql

**See:** DATABASE_SCHEMA > Constraints

---

## Mobile / Responsiveness Issues

### "Layout broken on mobile"

**Cause:** Missing responsive styles or viewport meta tag

**Fix:**

1. Add viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. Check Tailwind responsive classes (sm:, md:, lg:)
3. Test on actual mobile device, not just browser DevTools
4. Verify images have max-width: 100%

**See:** Module 13 documentation

---

### "Bottom navigation covered by keyboard"

**Cause:** Mobile keyboard pushes content up

**Fix:**

1. Add padding-bottom to account for keyboard
2. Use `env(safe-area-inset-bottom)` for iOS
3. Test form inputs on mobile
4. Consider moving navigation to top on mobile

**See:** Module 13 > Chunk 1 > Mobile Responsiveness

---

## Development Environment Issues

### "pnpm install fails"

**Cause:** Node version incompatibility or network issues

**Fix:**

1. Check Node version: `node -v` (requires 18+)
2. Clear pnpm cache: `pnpm store prune`
3. Delete node_modules and pnpm-lock.yaml, reinstall
4. Check internet connection (pnpm downloads from npm)

**See:** QUICK_START > Prerequisites

---

### "Drizzle Studio won't open"

**Cause:** Port 3000 already in use or database connection issue

**Fix:**

1. Stop other apps using port 3000
2. Verify DATABASE_URL is correct
3. Try different port: `pnpm drizzle-kit studio --port 3001`
4. Check Drizzle Kit version: `pnpm drizzle-kit --version`

**See:** QUICK_START > Verify It Works

---

### "Hot reload not working"

**Cause:** Next.js dev server issue or file watcher limit

**Fix:**

1. Restart dev server: stop and run `pnpm dev` again
2. Increase file watcher limit (Mac/Linux): `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`
3. Check no TypeScript errors blocking reload
4. Try clearing .next folder: `rm -rf .next`

---

## When All Else Fails

**Nuclear Options (Development Only):**

1. **Clear everything and restart:**

```bash
rm -rf node_modules .next
pnpm install
pnpm dev
```

1. **Reset database:**

```bash
# Drop all tables (Drizzle Studio or psql)
# Re-run migrations
pnpm drizzle-kit push
```

1. **Clear browser data:**
- Clear cookies for [localhost](http://localhost)
- Clear localStorage
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
1. **Check service status:**
- Neon: https://neonstatus.com
- Cloudflare: https://www.cloudflarestatus.com
- Resend: https://resend.com/status

**Still broken?** Check module implementation guides for specific edge cases and gotchas. Every module has extensive "Things to Watch For" section.