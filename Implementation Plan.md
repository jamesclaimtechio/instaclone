# Instagram Clone - Implementation Plan

> **Current Status:** 📍 Module 1 - Project Setup Phase  
> **Started:** [Add date when you begin]  
> **Target Completion:** [Add target date]

---

## 📊 Overall Progress

```
Foundation:    [██████████] 100% (3/3 modules) ✅ Modules 1-3 Complete!
Core Features: [░░░░░░░░░░] 0% (0/4 modules)
Social:        [░░░░░░░░░░] 0% (0/4 modules)
Polish:        [░░░░░░░░░░] 0% (0/2 modules)
───────────────────────────────────────
Total:         [███░░░░░░░] 23% (3/13 modules)
```

**Estimated Timeline:** 102-131 hours total  
- Part-time (10 hrs/week): 10-13 weeks  
- Full-time (40 hrs/week): 3-4 weeks

---

## 🎯 Quick Navigation

| Phase | Modules | Status | Jump To |
|-------|---------|--------|---------|
| Foundation | 1-3 | ⏳ Not Started | [Phase 1](#phase-1-foundation-week-1-2-) |
| Core Features | 4-6 | 🔒 Locked | [Phase 2](#phase-2-core-features-week-3-5-) |
| Social | 7-9 | 🔒 Locked | [Phase 3](#phase-3-social-features-week-6-8-) |
| Polish | 10-13 | 🔒 Locked | [Phase 4](#phase-5-polish--deploy-week-12-) |

**Legend:**  
✅ Complete | 🚧 In Progress | ⏳ Not Started | 🔒 Locked (prerequisites incomplete) | ⏭️ Skipped

---

## 🎯 Project Milestones

```
┌─────────────────────────────────────────────────────────┐
│ Foundation → Core Features → Social → Advanced → Polish│
│   Mod 1-3         Mod 4-6      Mod 7-9   Mod 10-12  13 │
└─────────────────────────────────────────────────────────┘
```

**Milestone 1:** Foundation Complete (Modules 1-3) → Can register and login

**Milestone 2:** Core Complete (Modules 4-6) → Can create and view posts

**Milestone 3:** Social Complete (Modules 7-9) → Can like, comment, follow

**Milestone 4:** Advanced Complete (Modules 10-12) → Search, admin, password reset

**Milestone 5:** Production Ready (Module 13) → Polished and deployed

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1-2) ⏳

**Goal:** Database setup, authentication, and email verification working

### ✅ Module 1: Project Setup & Database Schema

**Duration:** 6-8 hours (Completed in ~1.7 hours)

**Dependencies:** None

**Deliverables:**

- [x]  Next.js project initialized with TypeScript, Tailwind
- [x]  Drizzle ORM configured
- [x]  All 6 database tables created with indexes
- [x]  Migrations generated successfully
- [x]  shadcn/ui configured with 10 components
- [x]  Environment variables configured

**Completion Criteria:**

- ✅ `pnpm dev` starts with no errors
- ✅ Database schema complete and migration generated
- ✅ All shadcn/ui components installed and tested
- ✅ TypeScript compilation passes
- ✅ Production build succeeds

**📖 Guide:** [Feature: Project Setup & Database Schema (Module 1)](https://www.notion.so/Feature-Project-Setup-Database-Schema-Module-1-c5a1ac3384454546bace562f112f7d04?pvs=21)

---

### ✅ Module 2: Core Authentication System

**Duration:** 10-12 hours (Completed in ~2.2 hours)

**Dependencies:** Module 1 complete ✅

**Deliverables:**

- [x]  Registration page with email, password, username
- [x]  Login page with credential validation
- [x]  JWT generation with bcrypt password hashing
- [x]  HTTP-only cookie implementation
- [x]  Middleware protecting routes with JWT verification
- [x]  Logout functionality

**Completion Criteria:**

- ✅ Can register new user
- ✅ Can login with correct credentials
- ✅ Protected routes redirect unauthenticated users
- ✅ Logout clears session

**📖 Guide:** [Feature: Core Authentication System (Module 2)](https://www.notion.so/Feature-Core-Authentication-System-Module-2-ddaf0c7f01744b518a2e74503291c650?pvs=21)

---

### ✅ Module 3: Email Service & OTP Verification

**Duration:** 6-8 hours (Completed in ~1.7 hours)

**Dependencies:** Module 2 complete ✅

**Deliverables:**

- [x]  Resend API integrated
- [x]  OTP generation (6-digit, 15-min expiry)
- [x]  Email templates (verification)
- [x]  OTP validation logic
- [x]  Resend OTP functionality
- [x]  Unverified user restrictions (helper ready for Module 6+)

**Completion Criteria:**

- ✅ OTP email received after registration
- ✅ Valid OTP sets emailVerified=true
- ✅ Verification UI complete with rate limiting
- ✅ Resend OTP works correctly

**📖 Guide:** [Feature: Email Service & OTP Verification (Module 3)](https://www.notion.so/Feature-Email-Service-OTP-Verification-Module-3-c027864c6da945adb4470f98f4e86b98?pvs=21)

**✅ Milestone 1:** Foundation Complete

---

### Phase 2: Core Features (Week 3-5) ⏸️

**Goal:** User profiles, image uploads, posts, and feed working

### ⬜ Module 4: User Profiles

**Duration:** 8-10 hours

**Dependencies:** Module 2 complete

**Deliverables:**

- [ ]  Profile pages at `/profile/[username]` and `/@[username]`
- [ ]  Profile displays: picture, bio, counts, posts grid
- [ ]  Edit profile functionality (bio, picture)
- [ ]  Default avatar for users without picture
- [ ]  Clickable usernames throughout app

**Completion Criteria:**

- Profile page loads with all info
- Edit profile updates bio and picture
- Posts grid shows user's posts
- Invalid username shows 404

**📖 Guide:** [Feature: User Profiles (Module 4)](https://www.notion.so/Feature-User-Profiles-Module-4-c8a75a59ebbe4146b7bf3a469b7814dc?pvs=21)

---

### ⬜ Module 5: Image Upload & R2 Storage

**Duration:** 12-15 hours

**Dependencies:** Module 1 complete

**Deliverables:**

- [ ]  R2 bucket configured with public read
- [ ]  Sharp image processing pipeline
- [ ]  Generate 3 sizes: thumbnail (400px), full (1200px), blur (20px)
- [ ]  R2 upload with S3 SDK
- [ ]  Error handling for upload failures

**Completion Criteria:**

- Upload generates 3 image versions
- All 3 versions uploaded to R2
- R2 URLs publicly accessible
- Blur placeholder generated

**📖 Guide:** [Feature: Image Upload & R2 Storage (Module 5)](https://www.notion.so/Feature-Image-Upload-R2-Storage-Module-5-47d866c9f8dc4aee978e41057a549d8d?pvs=21)

---

### ⬜ Module 6: Photo Posts & Feed

**Duration:** 10-12 hours

**Dependencies:** Modules 2, 4, 5 complete

**Deliverables:**

- [ ]  Post creation form (image + caption)
- [ ]  Global feed showing all posts
- [ ]  Post permalink pages
- [ ]  Post deletion (own posts)
- [ ]  Pagination (30 posts per page)
- [ ]  Skeleton loaders

**Completion Criteria:**

- Can create post with image and caption
- Feed displays all posts chronologically
- Pagination works correctly
- Can delete own posts
- Cascade deletes likes and comments

**📖 Guide:** [Feature: Photo Posts & Feed (Module 6)](https://www.notion.so/Feature-Photo-Posts-Feed-Module-6-54b798e74ade45c1a7a3c008a53d03f5?pvs=21)

**✅ Milestone 2:** Core Complete (Can post and view)

---

### Phase 3: Social Features (Week 6-8) ⏸️

**Goal:** Likes, comments, and follows working with optimistic UI

### ⬜ Module 7: Likes System

**Duration:** 6-8 hours

**Dependencies:** Module 6 complete

**Deliverables:**

- [ ]  Like button with optimistic UI
- [ ]  Toggle behavior (like/unlike)
- [ ]  Like count display
- [ ]  Database unique constraint
- [ ]  Error handling with rollback

**Completion Criteria:**

- Clicking heart likes immediately
- State persists on refresh
- Rollback works on error
- No duplicate likes possible

**📖 Guide:** [Feature: Likes System (Module 7)](https://www.notion.so/Feature-Likes-System-Module-7-463be67cc53d47a4a6eabb0223594741?pvs=21)

---

### ⬜ Module 8: Comments System

**Duration:** 8-10 hours

**Dependencies:** Module 6 complete

**Deliverables:**

- [ ]  Comment input with optimistic UI
- [ ]  Comment display (flat, newest first)
- [ ]  Comment deletion (own + post author + admin)
- [ ]  Comment count display
- [ ]  Confirmation dialogs

**Completion Criteria:**

- Comments appear immediately
- Displayed in correct order
- Post author can delete any comment on their post
- Empty state handled

**📖 Guide:** [Feature: Comments System (Module 8)](https://www.notion.so/Feature-Comments-System-Module-8-2b178a3a5b124f4ead9ca7c012cb6800?pvs=21)

---

### ⬜ Module 9: Follow System

**Duration:** 6-8 hours

**Dependencies:** Module 4 complete

**Deliverables:**

- [ ]  Follow button with optimistic UI
- [ ]  Follower and following counts
- [ ]  Toggle behavior (follow/unfollow)
- [ ]  Self-follow prevention
- [ ]  Database unique constraint

**Completion Criteria:**

- Follow button works on profiles
- Counts update immediately
- Cannot follow self
- State persists

**📖 Guide:** [Feature: Follow System (Module 9)](https://www.notion.so/Feature-Follow-System-Module-9-8c6ffd9681cb43f58f6d75853cd6ffc8?pvs=21)

**✅ Milestone 3:** Social Complete (Full engagement)

---

### Phase 4: Advanced Features (Week 9-11) ⏸️

**Goal:** Search, admin tools, and password reset working

### ⬜ Module 10: User Search

**Duration:** 4-6 hours

**Dependencies:** Module 4 complete

**Deliverables:**

- [ ]  Search bar in navigation
- [ ]  Live search with debouncing
- [ ]  ILIKE query for username
- [ ]  Results dropdown (max 10)
- [ ]  Click result navigates to profile

**Completion Criteria:**

- Search works as you type
- Case-insensitive partial matching
- Max 10 results shown
- No results handled gracefully

**📖 Guide:** [Feature: User Search (Module 10)](https://www.notion.so/Feature-User-Search-Module-10-52da04f3c7f74e18b60509fd313caa4c?pvs=21)

---

### ⬜ Module 11: Admin Dashboard

**Duration:** 10-12 hours

**Dependencies:** Modules 2, 6, 8 complete

**Deliverables:**

- [ ]  Admin route protection (isAdmin flag)
- [ ]  User list with delete functionality
- [ ]  Post list with delete functionality
- [ ]  Comment list with delete functionality
- [ ]  Cascade delete verification
- [ ]  Confirmation dialogs

**Completion Criteria:**

- Admin can access /admin
- Non-admin redirected with error
- All deletions cascade correctly
- Stats display correctly

**📖 Guide:** [Feature: Admin Dashboard (Module 11)](https://www.notion.so/Feature-Admin-Dashboard-Module-11-8a4fade3488b408082758c1422379ade?pvs=21)

---

### ⬜ Module 12: Password Reset

**Duration:** 6-8 hours

**Dependencies:** Module 3 complete

**Deliverables:**

- [ ]  "Forgot Password" link
- [ ]  Reset token generation (1-hour expiry)
- [ ]  Reset email with link
- [ ]  Reset password form
- [ ]  Token validation
- [ ]  Password update

**Completion Criteria:**

- Reset email received
- Reset link works within 1 hour
- New password works for login
- Expired token shows error

**📖 Guide:** [Feature: Password Reset (Module 12)](https://www.notion.so/Feature-Password-Reset-Module-12-b8ac3945a07b424480b30202ba591d85?pvs=21)

**✅ Milestone 4:** Advanced Complete (Full features)

---

### Phase 5: Polish & Deploy (Week 12) ⏸️

**Goal:** Production-ready with responsive design and optimizations

### ⬜ Module 13: UX Polish & Responsiveness

**Duration:** 10-14 hours

**Dependencies:** All modules 1-12 complete

**Deliverables:**

- [ ]  Mobile-first responsive design
- [ ]  Bottom navigation on mobile
- [ ]  Touch-optimized (44px min targets)
- [ ]  Loading states everywhere
- [ ]  Error boundaries
- [ ]  Skeleton loaders
- [ ]  Accessibility (WCAG AA)
- [ ]  Performance optimization

**Completion Criteria:**

- Works on mobile, tablet, desktop
- All loading states present
- Errors handled gracefully
- Lighthouse scores: Performance >90, Accessibility 100
- Keyboard navigation works

**📖 Guide:** [Feature: UX Polish & Responsiveness (Module 13)](https://www.notion.so/Feature-UX-Polish-Responsiveness-Module-13-32a7bb20e97c4202b708832f903b31bc?pvs=21)

**✅ Milestone 5:** Production Ready! 🎉

---

## 📊 Progress Summary

| Phase | Modules | Status | Duration |
| --- | --- | --- | --- |
| **Foundation** | 1-3 | ⬜ Not Started | 22-28 hrs |
| **Core Features** | 4-6 | ⬜ Not Started | 30-37 hrs |
| **Social** | 7-9 | ⬜ Not Started | 20-26 hrs |
| **Advanced** | 10-12 | ⬜ Not Started | 20-26 hrs |
| **Polish** | 13 | ⬜ Not Started | 10-14 hrs |
| **TOTAL** | 1-13 | **0/13 Complete** | **102-131 hrs** |

---

## 🔄 Current Status

**Phase:** Foundation (Setup)

**Working On:** ⬜ Module 1 (Not Started)

**Next Up:** Module 2 → Module 3

**Blockers:** None

**Notes:** Ready to begin implementation

---

## 📝 Implementation Notes

### Completed Modules

*As you complete modules, add notes here about challenges, decisions, or deviations.*

---

### Known Issues / Tech Debt

*Track issues to address later. Don't let these block progress.*

---

### Deviations from Spec

*Document any intentional changes from Master Spec or module guides.*

---

## ⚡ Quick Reference

**Current Module:** Module 1

**Dependencies:** None

**Estimated Time:** 6-8 hours

**Guide:** [Feature: Project Setup & Database Schema (Module 1)](https://www.notion.so/Feature-Project-Setup-Database-Schema-Module-1-c5a1ac3384454546bace562f112f7d04?pvs=21)

**Next Actions:**

1. Set up Next.js project
2. Configure Drizzle ORM
3. Create database schema
4. Run migrations
5. Verify setup

---

## 🎯 Definition of Done (Per Module)

A module is complete when:

- [ ]  All deliverables implemented
- [ ]  All completion criteria met
- [ ]  All tests pass (from module guide)
- [ ]  No console errors
- [ ]  Code committed to git
- [ ]  This plan updated (checkbox checked)

---

**Remember:** Follow the order. Each module depends on previous ones. Don't skip ahead.

**Questions?** Check TASK_ROUTER or TROUBLESHOOTING

---

## 🐛 Known Issues / Tech Debt

Track issues as you build. Don't let these block progress.

| Issue | Impact | Module | Priority | Status |
|-------|--------|--------|----------|--------|
| _No issues yet_ | - | - | - | - |

**Example:**
| OTP rate limiting not tested | Security | 3 | High | ⏳ Todo |

---

## 📝 Decision Log

Track major decisions as you make them.

### [Date] - Decision Name
**Decision:** [What you decided]  
**Reason:** [Why you made this choice]  
**Alternatives Considered:** [What else you thought about]  
**Impact:** [What this affects]

---

## 🎓 Learning Log

Track new concepts learned during development.

### [Date] - Topic Name
**What I Learned:** [Your notes]  
**Resources:** [Links to docs/tutorials]  
**Applied In:** [Which module/feature]

---

## 🏁 Next Actions

### Right Now:
1. [ ] Complete Module 1, Chunk 1.1 (Next.js App Initialization)
2. [ ] Document any blockers encountered
3. [ ] Update progress bars above

### This Week:
- [ ] Finish Module 1 completely
- [ ] Start Module 2 if time permits

### This Month:
- [ ] Complete Phase 1 (Modules 1-3)
- [ ] Begin Phase 2

---

## 🚀 Deployment Checklist

Use this when ready to deploy to production:

- [ ] All environment variables set in Vercel
- [ ] Production database (Neon) configured
- [ ] Production R2 bucket created
- [ ] Resend domain verified for production
- [ ] Build succeeds without errors (`pnpm build`)
- [ ] All features tested in production
- [ ] Performance metrics acceptable (<3s LCP)
- [ ] Security headers configured
- [ ] Error tracking set up (optional)

---

## 📈 Metrics & Goals

### Development Velocity
- **Target:** 1 module per week (average)
- **Actual:** [Track as you go]

### Code Quality
- [ ] TypeScript strict mode (no `any` types)
- [ ] No console errors in production
- [ ] All Server Actions have auth checks
- [ ] All foreign keys have CASCADE deletes
- [ ] All images use 3-size pipeline

### Performance Targets
- [ ] Feed loads in <2 seconds
- [ ] Database queries <100ms (indexed)
- [ ] Images show blur placeholder during load
- [ ] Optimistic UI updates <50ms

---

**Last Updated:** [Add date when you update this file]  
**Current Focus:** Module 1 - Project Setup & Database Schema