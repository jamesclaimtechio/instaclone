# Instagram Clone - Session Tracker

> **Purpose:** Track progress through module implementation, document decisions, and identify blockers.

---

## 📊 Current Status

**Active Module:** Module 2 - Core Authentication System  
**Active Chunk:** Chunk 2.1 - Auth Utilities & JWT Infrastructure  
**Status:** ✅ Complete  
**Started:** December 27, 2025

---

## 🎯 Module Progress

### Module 1: Project Setup & Database Schema ✅ (3/3 chunks)

| Chunk | Name | Status | Started | Completed | Duration |
|-------|------|--------|---------|-----------|----------|
| 1.1 | Next.js App Initialization | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~30 min |
| 1.2 | Database Schema & Drizzle ORM | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~45 min |
| 1.3 | shadcn/ui & Environment Setup | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~25 min |

**Module Status:** ✅ Complete (3/3 chunks complete)  
**Actual Duration:** ~1.7 hours  
**Estimated Duration:** 6-8 hours total

### Module 2: Core Authentication System (1/5 chunks)

| Chunk | Name | Status | Started | Completed | Duration |
|-------|------|--------|---------|-----------|----------|
| 2.1 | Auth Utilities & JWT Infrastructure | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~35 min |
| 2.2 | User Registration Flow | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~25 min |
| 2.3 | Login & Logout Flow | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~20 min |
| 2.4 | Auth Middleware & Route Protection | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~20 min |
| 2.5 | Registration & Login UI | ✅ Complete | Dec 27, 2025 | Dec 27, 2025 | ~30 min |

**Module Status:** ✅ Complete (5/5 chunks complete)  
**Actual Duration:** ~2.2 hours  
**Estimated Duration:** 14-18 hours total

### Module 3: Email Service & OTP Verification (1/4 chunks)

| Chunk | Name | Status | Started | Completed | Duration |
|-------|------|--------|---------|-----------|----------|
| 3.1 | Email Service Integration | ✅ Complete | Dec 28, 2025 | Dec 28, 2025 | ~25 min |
| 3.2 | OTP Generation & Storage | ⏳ Not Started | - | - | - |
| 3.3 | OTP Verification Flow | ⏳ Not Started | - | - | - |
| 3.4 | Verification UI & Enforcement | ⏳ Not Started | - | - | - |

**Module Status:** 🚧 In Progress (1/4 chunks complete)  
**Estimated Duration:** 8-12 hours total

---

## 📝 Session Log

### Session 1 - December 27, 2025

**Focus:** Module 1, Chunk 1.1 - Next.js App Initialization

**Goals:**
- [x] Initialize Next.js 15 with TypeScript, Tailwind CSS, App Router
- [x] Enable TypeScript strict mode
- [x] Create project directory structure
- [x] Setup environment variables foundation
- [x] Initialize git repository
- [x] Verify development environment works

**Progress:**
- ✅ Created SESSION_TRACKER.md to monitor progress
- ✅ Initialized Next.js 15 with React 19, TypeScript, Tailwind CSS, App Router
- ✅ Enhanced TypeScript with strict mode, strictNullChecks, and noUncheckedIndexedAccess
- ✅ Created directory structure: app/actions, components/ui, lib, db/migrations
- ✅ Setup .env.local and .env.example with all required environment variables
- ✅ Initialized git repository with proper .gitignore
- ✅ Verified dev server starts successfully on localhost:3000
- ✅ Verified production build completes without errors
- ✅ Made initial commits documenting setup

**Decisions Made:**
- Using pnpm as package manager (per .cursorrules requirement)
- App Router architecture (not Pages Router)
- React 19 required for useOptimistic hook support
- TypeScript strict mode for maximum type safety

**Blockers:** None

**Notes:**
- Successfully completed Chunk 1.1 in ~30 minutes
- React 19.2.3 installed (supports useOptimistic hook)
- Next.js 16.1.1 with Turbopack for fast dev experience
- All verification tests passed (dev server, production build, TypeScript compilation)
- Ready to proceed to Chunk 1.2 (Database Schema & Drizzle ORM)

---

## 🚨 Active Blockers

*No blockers at this time*

---

## ✅ Completed Chunks

### Chunk 3.1 - Email Service Integration ✅
**Completed:** December 28, 2025  
**Duration:** ~25 minutes  
**Key Achievements:**
- Installed Resend SDK v6.6.0 for email delivery
- Created lib/email.ts with complete email service
- Implemented renderOTPEmail() with responsive HTML template
- Built sendOTPEmail() function with retry logic
- Exponential backoff retry strategy (1s, 2s, 4s delays)
- Max 3 retries on 5xx errors, no retry on 4xx
- Custom error classes (EmailSendError, EmailRateLimitError, EmailInvalidRecipientError)
- Email logging (recipient and status, no sensitive data)
- Used Resend test sender (onboarding@resend.dev)
- Sent test emails successfully - confirmed delivery
- TypeScript compilation passing

**Challenges:**
- Resend API response type is union (success | error)
- Fixed by checking 'error' in result and extracting data.id
- tsx doesn't auto-load .env.local (used direct env vars for testing)

**Learnings:**
- Resend test email (onboarding@resend.dev) doesn't require domain verification
- Email HTML must use inline styles and table-based layout for compatibility
- OTP code should be 48px font, bold, letter-spaced for readability
- Retry only on 5xx and network errors, not 4xx (permanent failures)
- Email service errors shouldn't block registration (return false, don't throw)

## ✅ Completed Chunks

### Chunk 1.1 - Next.js App Initialization ✅
**Completed:** December 27, 2025  
**Duration:** ~30 minutes  
**Key Achievements:**
- Next.js 16.1.1 with React 19.2.3 initialized
- TypeScript strict mode enabled with enhanced null checks
- Project structure created (app/actions, components/ui, lib, db)
- Environment variables configured (.env.local, .env.example)
- Git repository initialized with proper commits
- Dev server verified working on localhost:3000
- Production build verified successful

**Challenges:** 
- Directory name "Instagram Clone" has spaces and capitals, not npm-compatible
- Workaround: Created in temp directory and moved files to root

**Learnings:**
- Next.js 16 uses Turbopack by default (faster than Webpack)
- React 19 is now stable and fully supported
- .env files blocked by .gitignore, used terminal commands instead

### Chunk 1.2 - Database Schema & Drizzle ORM ✅
**Completed:** December 27, 2025  
**Duration:** ~45 minutes  
**Key Achievements:**
- Drizzle ORM 0.45.1 and Drizzle Kit 0.31.8 installed
- Complete schema for all 6 tables (users, posts, comments, likes, follows, otp_codes)
- Composite unique constraints on likes (postId+userId) and follows (followerId+followingId)
- CASCADE deletes configured on all foreign keys
- Indexes created on username, email, foreign keys, and timestamps
- Initial migration generated (0000_chunky_tigra.sql)
- Seed script with sample data (3 users, 5 posts, 4 comments, 8 likes, 4 follows)
- Database client with singleton pattern
- Comprehensive db/README.md documentation

**Challenges:**
- TypeScript strict mode caught undefined array destructuring in seed script
- Fixed by adding null checks after .returning() calls
- Drizzle ORM has some internal type errors, resolved with --skipLibCheck

**Learnings:**
- Drizzle's composite unique constraint syntax: `unique().on(col1, col2)`
- CASCADE delete syntax: `.references(() => table.id, { onDelete: 'cascade' })`
- Index naming best practice: explicit names prevent collisions
- OTP codes must be text (not integer) to preserve leading zeros
- Boolean defaults critical for security (isAdmin, emailVerified must default false)

### Chunk 1.3 - shadcn/ui & Environment Setup ✅
**Completed:** December 27, 2025  
**Duration:** ~25 minutes  
**Key Achievements:**
- shadcn/ui initialized with neutral/zinc color scheme
- Installed 10 core components: Button, Input, Label, Card, Avatar, Skeleton, Dialog, Alert Dialog, Textarea, Sonner
- cn() utility function configured for intelligent class merging
- CSS variables set up in globals.css for theming
- Toaster component added to root layout for notifications
- lucide-react icons installed (562.0)
- All components verified with test page
- TypeScript compilation passes
- Production build successful

**Challenges:**
- shadcn init command requires interactive input, had to work around automation
- Initially selected neutral color, manually verified zinc in components.json

**Learnings:**
- shadcn components are copied to your project (not in node_modules), fully customizable
- Sonner provides better toast UX than built-in shadcn toast
- cn() utility uses tailwind-merge to intelligently handle overlapping Tailwind classes
- Components auto-install their Radix UI primitive dependencies
- CSS variables enable easy theming and dark mode support

### Chunk 2.1 - Auth Utilities & JWT Infrastructure ✅
**Completed:** December 27, 2025  
**Duration:** ~35 minutes  
**Key Achievements:**
- Installed jose v6.1.3 for modern JWT operations
- Implemented hashPassword() with bcrypt cost 12 (~270ms per hash)
- Implemented verifyPassword() with timing-safe comparison
- Implemented generateToken() with 30-day expiration
- Implemented verifyToken() with signature and expiration validation
- Created custom error classes (TokenExpiredError, InvalidTokenError)
- Implemented cookie utilities with security flags (httpOnly, secure, sameSite=strict)
- Created getCurrentUser() helper for auth checks throughout app
- Added JWT_SECRET startup validation (64+ characters required)
- All 8 verification tests passed successfully

**Challenges:**
- Next.js 15+ cookies() returns Promise, needed to await in all cookie functions
- JWT_SECRET validation must happen at module load to catch config errors early
- Verification script needed JWT_SECRET in environment to run tests

**Learnings:**
- jose uses Uint8Array for secret keys, must encode string with TextEncoder
- bcrypt.hash() is async and takes ~250-300ms (intentionally slow for security)
- JWT expiration must be in seconds (not milliseconds) for exp claim
- Cookie utilities must be async in Next.js 15+ App Router
- Token verification should return null (not throw) for graceful degradation in getCurrentUser()

### Chunk 2.2 - User Registration Flow ✅
**Completed:** December 27, 2025  
**Duration:** ~25 minutes  
**Key Achievements:**
- Created registerUser Server Action in app/actions/auth.ts
- Implemented email format validation (RFC 5322 simplified regex)
- Implemented username format validation (alphanumeric + underscore/hyphen)
- Implemented password validation (non-empty, max 1000 chars, no other restrictions)
- Email uniqueness check with case-insensitive matching (LOWER() SQL function)
- Username uniqueness check with case-sensitive matching
- Database insert with emailVerified=false and isAdmin=false defaults
- Race condition handling for unique constraint violations
- Post-registration auto-login with JWT cookie
- Field-specific error responses for better UX
- All 6 validation tests passed

**Challenges:**
- Next.js redirect() cannot be tested in standalone scripts (throws NEXT_REDIRECT signal)
- Drizzle sql template literal needed for LOWER() function in case-insensitive email query
- Race condition requires catching Postgres error code 23505 and parsing error message

**Learnings:**
- Email must be normalized to lowercase before storage AND checking
- Username is case-sensitive per spec (John and john are different users)
- Race conditions handled at database level, not just application checks
- redirect() in Server Actions throws special error caught by Next.js framework
- FormData extraction requires .toString() and null coalescing for type safety

### Chunk 2.3 - Login & Logout Flow ✅
**Completed:** December 27, 2025  
**Duration:** ~20 minutes  
**Key Achievements:**
- Implemented loginUser Server Action with credential verification
- User lookup by email with case-insensitive matching (LOWER() SQL)
- Password verification using bcrypt.compare() from auth utilities
- Timing-safe dummy password hashing for non-existent users
- Generic error message 'Invalid credentials' prevents user enumeration
- Post-login JWT generation and cookie setting
- Automatic redirect to feed on successful login
- Implemented logoutUser Server Action with cookie clearing
- Logout redirects to /login page
- All 8 validation and security tests passed

**Challenges:**
- Timing safety requires hashing dummy password when user not found (~270ms overhead)
- Database connection error in tests expected (no real DB), but logic verified
- Must use same error message for both "user not found" and "wrong password"

**Learnings:**
- Timing attacks prevented by hashing fixed dummy password on user-not-found path
- Generic error messages critical: never reveal "email not found" vs "wrong password"
- Email case-insensitive for login (same as registration)
- logoutUser() is simple: deleteAuthCookie() + redirect('/login')
- Fixed dummy password string ensures consistent timing across all failed logins

### Chunk 2.4 - Auth Middleware & Route Protection ✅
**Completed:** December 27, 2025  
**Duration:** ~20 minutes  
**Key Achievements:**
- Created middleware.ts at project root for request interception
- JWT verification on every request with comprehensive error handling
- Protected route configuration (all routes except public ones)
- Public routes defined: /login, /register, / (homepage)
- Unauthenticated users redirected to /login with returnUrl preserved
- Authenticated users redirected away from /login and /register to feed
- User context injection via request headers (x-user-id, x-user-is-admin)
- Created getUserFromHeaders() helper for Server Components and Server Actions
- Middleware matcher configured to exclude static assets for performance
- Open redirect protection (validates returnUrl is relative path)
- Test protected route created to verify middleware functionality
- TypeScript compilation passing

**Challenges:**
- Next.js middleware requires specific export format (default function + config)
- Headers must be injected into NextResponse for downstream access
- Middleware runs on Edge runtime, limited to Edge-compatible APIs only

**Learnings:**
- middleware.ts MUST be at project root, not in app/ directory
- Matcher regex excludes static assets: /_next/static, images, favicon
- Public routes array prevents infinite redirect loops
- Request headers different from response headers (must set on response)
- getUserFromHeaders() provides user context without re-verifying JWT
- Middleware should not make database calls (too slow, runs on every request)

### Chunk 2.5 - Registration & Login UI ✅
**Completed:** December 27, 2025  
**Duration:** ~30 minutes  
**Key Achievements:**
- Created app/(auth) route group for authentication pages
- Built auth layout with centered card design (max-w-md, gray background)
- Created /register page with full registration form
- Created /login page with login form
- Registration form with email, username, password fields
- Login form with email and password fields
- Real-time username validation with 500ms debounce
- Password show/hide toggle with Eye/EyeOff icons
- Loading states with spinners during submission
- Field-specific error display (red borders, error messages below inputs)
- returnUrl handling in login form for deep linking
- Navigation links between forms ("Already have account?" / "Don't have account?")
- Full accessibility: ARIA labels, role="alert", keyboard navigation
- Mobile optimizations: inputMode, autoComplete, autoCapitalize
- Responsive design with shadcn/ui Card components
- useSearchParams wrapped in Suspense boundary for static rendering
- Production build successful (7 routes compiled)

**Challenges:**
- useSearchParams() requires Suspense boundary in Next.js for static generation
- Fixed by wrapping LoginFormInner in Suspense with skeleton fallback
- Build requires valid JWT_SECRET (64+ chars) even for static pages

**Learnings:**
- useSearchParams() must be wrapped in <Suspense> or page marked as dynamic
- Controlled inputs with useState preserve user input during errors
- Clear errors when user starts typing in error field for better UX
- Password toggle button needs tabIndex={-1} to skip in tab order
- autoComplete attributes help password managers: 'new-password' vs 'current-password'
- inputMode='email' shows @ key on mobile keyboards
- Form submission with FormData maintains HTML form semantics

---

## 📌 Key Decisions Log

### Decision 1: Package Manager
**Chosen:** pnpm  
**Reason:** Required by .cursorrules for consistency  
**Alternative Considered:** npm, yarn  
**Impact:** All developers must use pnpm for this project

### Decision 2: App Router vs Pages Router
**Chosen:** App Router  
**Reason:** Next.js 15 default, required by module spec  
**Alternative Considered:** Pages Router (legacy)  
**Impact:** All routes live in app/ directory, Server Components by default

### Decision 3: React Version
**Chosen:** React 19  
**Reason:** Required for useOptimistic hook (critical for social features)  
**Alternative Considered:** React 18 (more stable)  
**Impact:** May encounter beta package issues, but needed for spec compliance

---

## 🎓 Lessons Learned

*Will document learnings as implementation progresses*

---

## 📅 Next Session Preview

**Next Chunk:** 1.2 - Database Schema & Drizzle ORM  
**Prerequisites:** Chunk 1.1 complete (Next.js running)  
**Key Tasks:**
- Define all 6 database tables
- Configure Drizzle ORM
- Generate and run migrations
- Verify schema in Drizzle Studio

---

**Last Updated:** December 27, 2025  
**Next Review:** After Chunk 1.1 completion

