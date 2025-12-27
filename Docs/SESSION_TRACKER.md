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
| 2.3 | Login & Logout Flow | ⏳ Not Started | - | - | - |
| 2.4 | Auth Middleware & Route Protection | ⏳ Not Started | - | - | - |
| 2.5 | Registration & Login UI | ⏳ Not Started | - | - | - |

**Module Status:** 🚧 In Progress (2/5 chunks complete)  
**Estimated Duration:** 14-18 hours total

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

