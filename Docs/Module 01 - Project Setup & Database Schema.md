# Feature: Project Setup & Database Schema

**Core Problem:** Establish the technical foundation with properly configured Next.js app, Drizzle ORM, and complete database schema so all future modules can build on stable infrastructure.

**Total Chunks:** 3

**Total Estimated Duration:** 6-8 hours

**Feature Tracker Type:** New Feature

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Next.js App Initialization | 🏗️ | 2-3 hrs | None |
| 2 | Database Schema & Drizzle ORM | 🏗️ | 3-4 hrs | Chunk 1 (Next.js app running locally) |
| 3 | shadcn/ui & Environment Setup | 🏗️ | 1-2 hrs | Chunk 1 (TypeScript and Tailwind configured) |

---

# Chunk 1: 🏗️ Next.js App Initialization

Duration: 2-3 hours | Prerequisites: None

## Quick Reference

**Builds:** A running Next.js 15 application with TypeScript, Tailwind CSS, App Router, and basic project structure ready for feature development.

**Connects:** User's terminal → Creates project scaffold → Outputs running dev server and organized directory structure

**Pattern:** Next.js App Router with TypeScript and Tailwind (standard Next.js 15 setup pattern)

**Watch For:**

1. App Router vs Pages Router confusion - must use App Router
2. TypeScript strict mode not enabled by default
3. Tailwind CSS configuration incomplete for custom design tokens

## Context

### User Problem

Developers need a stable, modern Next.js foundation with TypeScript and Tailwind CSS configured correctly before any features can be built.

### From Module Brief

- **Next.js project initialization**: App Router, TypeScript, Tailwind CSS must all be configured in initial setup
- **Basic project structure**: app/, components/, lib/, db/ directories must exist
- **TypeScript strict mode**: Must be enabled for type safety throughout the project
- **Development environment**: Must run locally without errors on [localhost:3000](http://localhost:3000)

## What's Changing

### New Additions

- **Next.js application**: Full Next.js 15 app with App Router architecture, provides the foundation for all server and client components
- **TypeScript configuration**: Strict mode enabled, path aliases configured with @ prefix for clean imports
- **Tailwind CSS**: Utility-first styling framework configured with custom design tokens for Instagram-like aesthetic
- **Project directory structure**: Organized folders for app routes, reusable components, utility functions, and database code
- **Root layout**: Base layout component that wraps entire application, provides consistent structure
- **Package manager setup**: pnpm as the package manager with proper lockfile

### Modifications to Existing

N/A - This is the initial setup

### No Changes To

N/A - This is the initial setup

## Data Flow

### Project Initialization Flow

1. Developer runs Next.js creation command with App Router, TypeScript, Tailwind options
2. Package manager installs all dependencies (React 19, Next.js 15, TypeScript, Tailwind)
3. Default configuration files generated (next.config, tsconfig, tailwind.config)
4. Developer creates project directory structure (app/, components/, lib/, db/)
5. Root layout and basic page created
- If successful → Dev server starts on [localhost:3000](http://localhost:3000) with no errors
- If failed → Clear error message indicates missing dependencies or configuration issues
1. Final state: Running Next.js app ready for feature development

### Development Server Flow

1. Developer runs dev command
2. Next.js compiles TypeScript and Tailwind CSS
3. Dev server starts and watches for file changes
4. Hot module replacement enabled for fast development
- If successful → Browser loads app with no console errors
- If compilation errors → Terminal shows TypeScript or Tailwind errors with line numbers
1. Final state: Live dev environment with hot reload

## Things to Watch For

**App Router vs Pages Router confusion** → Developer might accidentally use Pages Router patterns in App Router → Verify all routes are in app/ directory not pages/, use layout.tsx and page.tsx file conventions, ensure Server Components are default

**TypeScript strict mode disabled** → Type safety compromised throughout project → Open tsconfig.json and verify "strict": true is set, also enable "strictNullChecks" and "noUncheckedIndexedAccess" for maximum safety

**Tailwind CSS not processing custom classes** → Custom design tokens don't work → Verify tailwind.config.ts includes correct content paths (app//*.{js,ts,jsx,tsx}), ensure PostCSS is configured, check that globals.css imports Tailwind directives

**Path aliases not working** → Import statements fail with module not found errors → Verify tsconfig.json has "paths": {"@/*": ["./src/*"]} or ["./"*] depending on structure, ensure baseUrl is set correctly

**Missing directory structure** → Features get built in wrong locations → Create all required folders upfront: app/, app/actions/, components/, components/ui/, lib/, db/, db/migrations/

**React 19 compatibility issues** → Some packages may not work with React 19 → Check that Next.js version explicitly supports React 19, verify in package.json that react and react-dom are both same version

**Node version mismatch** → Build fails with cryptic errors → Verify Node.js 18.17 or higher is installed, consider adding .nvmrc file with required version

**pnpm not installed** → Developer uses npm instead, causing lockfile conflicts → Install pnpm globally first, ensure pnpm-lock.yaml is created not package-lock.json, add package-lock.json to .gitignore

**Environment variables exposed to client** → Secrets leaked in browser bundle → Only variables prefixed with NEXT_PUBLIC_ are exposed to client, verify no sensitive data uses this prefix

**Middleware file in wrong location** → Auth middleware won't work later → Middleware must be at root level (middleware.ts) not in app/ directory

**Turbopack vs Webpack confusion** → Different dev server behaviors → Next.js 15 uses Turbopack by default, understand that some Webpack-specific plugins won't work

**TypeScript errors ignored** → Type safety compromised → Next.js will build even with TypeScript errors by default, consider adding "typescript.ignoreBuildErrors": false to next.config

**Tailwind IntelliSense not working** → Poor developer experience → Install Tailwind CSS IntelliSense VSCode extension, ensure it's enabled for TypeScript files

**CSS cascade order issues** → Styles conflict unexpectedly → Import global CSS only in root layout, never in components, use Tailwind @layer directives for custom CSS

**Server Components vs Client Components confusion** → Components fail with hydration errors → All components in App Router are Server Components by default, only add 'use client' when needed (state, effects, browser APIs)

**Missing favicon causing 404s** → Console errors on every page load → Add app/favicon.ico or define icon in metadata API

**Console warnings on fresh install** → Unclear if setup is correct → Some Next.js warnings are normal (e.g., missing metadata), but TypeScript errors or Tailwind errors are not

**Git not initialized** → No version control from start → Run git init, create .gitignore with node_modules/, .next/, .env.local

**ESLint configuration too permissive** → Poor code quality → Next.js includes ESLint, verify next.config has "eslint.ignoreDuringBuilds": false to catch issues

**Missing TypeScript types for dependencies** → Import errors and poor IntelliSense → Install @types/ packages for any libraries that need them

**Development build size warnings** → Confusion about bundle size → Development builds are larger than production, don't optimize prematurely

**Hardcoded [localhost](http://localhost) URLs** → Code breaks in production → Never hardcode [localhost](http://localhost), use environment variables or relative URLs

**Missing error boundaries** → Unhandled errors crash entire app → App Router has default error.tsx convention, plan to add these later

**Hydration mismatches** → Inconsistent rendering between server and client → Avoid using [Date.now](http://Date.now)(), Math.random(), or browser APIs in Server Components

**Async Server Component patterns unfamiliar** → Developer tries to use useEffect → Server Components can be async functions, fetch directly in component without useEffect

**Metadata API not used** → SEO and social sharing broken → Plan to use Next.js Metadata API in layout.tsx for titles, descriptions, Open Graph tags

**Font optimization ignored** → Flash of unstyled text → Plan to use next/font for Google Fonts or local fonts with automatic optimization

**Image optimization not planned** → Large image files slow down app → Remember to use next/image for all images, provides automatic optimization

**Absolute imports not configured** → Deep relative imports become unreadable (../../../../components/) → Verify path aliases work by testing an import from deep nested file

**Production build not tested** → Build-time errors discovered too late → Run production build (pnpm build) after setup to verify configuration is valid

**Memory leaks in dev mode** → Dev server slows down over time → This is normal with hot reload, restart dev server periodically during long sessions

## Testing Verification

### Existing Features Still Work

N/A - This is initial setup

### New Functionality Works

- [ ]  Run `pnpm dev` → Application starts on [localhost:3000](http://localhost:3000) with no errors
- [ ]  Open browser to [localhost:3000](http://localhost:3000) → Default Next.js page loads
- [ ]  Check browser console → No errors or warnings (except normal Next.js metadata warnings)
- [ ]  Check terminal → No TypeScript compilation errors
- [ ]  Verify hot reload → Edit a file, save, see changes without manual refresh
- [ ]  Check TypeScript strict mode → Open tsconfig.json, verify "strict": true
- [ ]  Test path alias → Create a test import using @/ prefix, verify it resolves
- [ ]  Test Tailwind → Add a Tailwind class to a component, verify styles apply
- [ ]  Run `pnpm build` → Production build completes without errors
- [ ]  Verify directory structure → app/, components/, lib/, db/ folders exist

### Edge Cases

- [ ]  Stop and restart dev server → Starts without errors
- [ ]  Open multiple browser tabs → Hot reload works in all tabs
- [ ]  Delete .next folder and restart → Rebuilds successfully
- [ ]  Create component with TypeScript error → Build fails with clear error message
- [ ]  Use invalid Tailwind class → No errors (will need Tailwind ESLint plugin later)

---

# Chunk 2: 🏗️ Database Schema & Drizzle ORM

Duration: 3-4 hours | Prerequisites: Chunk 1 completed (Next.js app running locally with TypeScript configured)

## Quick Reference

**Builds:** Complete database schema for all 6 tables with Drizzle ORM configured, migrations generated, and Neon PostgreSQL connection established.

**Connects:** Drizzle schema definition → Migration generator → Neon database → Application via database client

**Pattern:** Drizzle ORM schema-first approach with PostgreSQL dialect and automatic TypeScript type generation

**Watch For:**

1. Composite unique constraints not defined correctly (likes and follows tables)
2. Foreign key relationships missing ON DELETE CASCADE rules
3. Index definitions omitted or placed incorrectly

## Context

### User Problem

Developers need a fully defined, type-safe database schema with all tables, relationships, constraints, and indexes in place before building any features that persist data.

### From Module Brief

- **Six tables required**: users, posts, comments, likes, follows, otp_codes with specific column requirements
- **Composite unique constraints**: likes table needs (postId, userId), follows table needs (followerId, followingId)
- **Performance indexes**: username, email, post timestamps, user relationships must be indexed
- **Drizzle ORM**: Must use Drizzle for type-safe queries and migrations
- **Neon PostgreSQL**: Serverless Postgres database as the data store

## What's Changing

### New Additions

- **Database schema file**: Defines all 6 tables with proper column types, constraints, relationships, and indexes using Drizzle syntax
- **users table**: Stores user accounts with id (uuid), email (unique), username (unique), passwordHash, bio, profilePictureUrl, isAdmin (boolean), emailVerified (boolean), createdAt (timestamp)
- **posts table**: Stores photo posts with id (uuid), userId (foreign key), imageUrl, thumbnailUrl, caption (text, nullable), blurHash, createdAt (timestamp), includes index on userId and createdAt for feed queries
- **comments table**: Stores post comments with id (uuid), postId (foreign key), userId (foreign key), text, createdAt (timestamp), includes index on postId for efficient comment loading
- **likes table**: Stores post likes with id (uuid), postId (foreign key), userId (foreign key), createdAt (timestamp), includes composite unique constraint on (postId, userId) to prevent duplicate likes
- **follows table**: Stores follow relationships with id (uuid), followerId (foreign key), followingId (foreign key), createdAt (timestamp), includes composite unique constraint on (followerId, followingId) to prevent duplicate follows
- **otp_codes table**: Stores email verification codes with id (uuid), userId (foreign key), code (6-digit string), expiresAt (timestamp), createdAt (timestamp)
- **Drizzle configuration**: Drizzle-kit config file specifying PostgreSQL dialect, schema location, and migration output directory
- **Database connection utility**: Singleton pattern for Postgres connection using Drizzle client
- **Migration files**: Auto-generated SQL migrations that create all tables, constraints, and indexes
- **Drizzle Studio access**: Visual database browser for debugging and data inspection

### Modifications to Existing

- **Environment variables**: Add DATABASE_URL for Neon connection string
- **.env.local file**: Create with placeholder for database connection string
- **.gitignore**: Ensure .env.local is excluded from version control

### No Changes To

- **Next.js configuration**: Database setup is separate from Next.js config
- **Existing components**: No UI components depend on database yet

## Data Flow

### Schema Definition Flow

1. Developer defines schema in TypeScript using Drizzle's pgTable, text, uuid, timestamp, boolean functions
2. Drizzle parses schema to understand table structure
3. TypeScript types automatically inferred from schema definitions
- If successful → Schema file compiles without TypeScript errors
- If error → TypeScript shows invalid column types or relationships
1. Final state: Complete type-safe schema ready for migration generation

### Migration Generation Flow

1. Developer runs drizzle-kit generate command
2. Drizzle compares schema file to migration history
3. Drizzle generates SQL migration file in db/migrations/ directory
4. Migration includes CREATE TABLE statements, indexes, constraints
- If successful → Migration file created with timestamp prefix
- If error → Drizzle shows schema syntax errors
1. Final state: Migration file ready to apply to database

### Migration Execution Flow

1. Developer runs drizzle-kit migrate command (or push for dev)
2. Drizzle connects to Neon database using DATABASE_URL
3. Drizzle executes SQL statements from migration file
4. All tables, indexes, and constraints created in database
- If successful → Migration applied, schema matches database
- If error → Connection error, SQL syntax error, or constraint violation
1. Final state: Database ready for application queries

### Database Connection Flow

1. Application imports database client from db/index file
2. Singleton pattern ensures single connection pool
3. Connection established to Neon using connection string
4. Drizzle client provides type-safe query builder
- If successful → Queries execute and return typed results
- If connection fails → Error thrown with connection string format help
1. Final state: Type-safe database access throughout application

## Things to Watch For

**Missing CASCADE deletes** → Orphaned records remain when parent deleted → Add ON DELETE CASCADE to all foreign keys (userId in posts, postId in comments, postId in likes, userId in comments), ensures when user or post deleted, related data auto-deletes

**Composite unique constraint syntax** → Duplicate likes or follows possible → Drizzle syntax is not obvious, must use table.$columns in callback function for composite constraints, not simple array of column names

**UUID vs Serial ID confusion** → ID format inconsistency across tables → All tables must use uuid with .defaultRandom() for consistent 36-character IDs, not serial integers

**Index not created on foreign keys** → Slow queries on relationships → PostgreSQL doesn't auto-index foreign keys, must explicitly create indexes on userId, postId columns used in WHERE and JOIN clauses

**Username index not covering searches** → Search queries slow → Index on username column must support ILIKE queries, consider using PostgreSQL's text pattern ops if needed

**Timestamp without timezone** → Inconsistent time handling across timezones → Use timestamp with defaultNow() which stores UTC, application handles timezone conversion

**Nullable columns undefined** → Data validation gaps → Explicitly mark optional columns as nullable (caption, bio, profilePictureUrl), required columns as notNull()

**Password hash column too short** → Bcrypt hashes truncated → Use text() not varchar with limit, bcrypt generates 60-character hashes

**Email uniqueness not enforced** → Duplicate accounts possible → Add .unique() to email column, also add index for fast lookups

**Username uniqueness case-sensitive** → Users could register "John" and "john" → PostgreSQL unique constraints are case-sensitive by default, consider adding LOWER(username) index or handle in application

**Migration files edited manually** → Database out of sync with schema → Never edit generated migrations, always modify schema file and regenerate

**Drizzle-kit not installed as dev dependency** → Production bundle unnecessarily large → Install drizzle-kit as devDependency, only drizzle-orm is needed in production

**Database connection not pooled** → Too many connections exhaust database limit → Neon has built-in connection pooling, but verify connection is reused (singleton pattern), not created per request

**Environment variable not validated** → App starts without database connection → Add startup check that DATABASE_URL exists and is valid format before server accepts requests

**Migration rollback not planned** → Destructive changes can't be undone → Drizzle doesn't auto-generate rollback migrations, consider manual down migrations for risky schema changes

**OTP code stored as integer** → Leading zeros lost (code 012345 becomes 12345) → Store OTP code as text/string, not integer, to preserve leading zeros

**ExpiresAt timestamp not indexed** → Cleanup queries slow → Consider adding index on expiresAt in otp_codes table if planning background cleanup jobs

**IsAdmin defaults to true** → Security vulnerability → Explicitly default isAdmin to false, only set true manually for admin accounts

**EmailVerified defaults to true** → Users skip verification → Explicitly default emailVerified to false, set true only after OTP verification

**Drizzle Studio port conflict** → Can't open database browser → Drizzle Studio default port may conflict, check docs for port configuration if needed

**Schema file grows too large** → Hard to maintain single file → For this project 6 tables is manageable, but consider splitting by domain if schema expands

**Type imports vs value imports** → TypeScript errors in schema file → Drizzle exports both types and runtime values, ensure correct import syntax

**Postgres-specific types used** → Schema not portable to other databases → This is acceptable, Drizzle is configured for PostgreSQL, uuid and text are Postgres types

**Connection string with special characters** → Connection fails with parse error → Neon connection string includes special characters, must be URL-encoded if password has special chars

**SSL certificate verification issues** → Connection rejected by Neon → Neon requires SSL, connection string should include sslmode=require parameter

**Timezone mismatch in timestamps** → Created dates show wrong time → Always store UTC in database (defaultNow() does this), convert to user timezone in UI layer

**Caption column max length** → Very long captions cause errors → Use text() type which has no length limit per Master Spec requirement (unlimited caption length)

**Relation helpers not defined** → Queries require manual joins → Drizzle supports defining relations for easier queries, consider adding relations() for better DX

**Mutation queries not wrapped in transactions** → Partial updates possible → Plan to wrap related operations (create post + update user count) in transactions

**No soft deletes** → Deleted data gone forever → Master Spec requires permanent deletes, ensure this is intentional, no deletedAt column needed

**Profile picture URL validation** → Invalid URLs stored in database → Database allows any text, application must validate URL format before insert

**Blur hash format not validated** → Invalid base64 stored → Database accepts any text, application must validate blur hash is proper base64

**Created at editable** → Timestamps can be manipulated → Use .defaultNow() which sets timestamp at insert time, make column non-editable in application logic

**Foreign key targets wrong column** → References fail or point to wrong data → Verify all foreign keys reference id (uuid) column of parent table, not other columns

**Index naming collisions** → Migration fails with duplicate name → Drizzle auto-generates index names, but explicit names prevent collisions, use descriptive names like idx_posts_user_id

**Drizzle push vs migrate confusion** → Wrong command for environment → Use drizzle-kit push for dev (applies changes directly), drizzle-kit migrate for production (uses migration files)

## Testing Verification

### Existing Features Still Work

- [ ]  Next.js app still runs → pnpm dev works without errors
- [ ]  TypeScript compilation succeeds → No new TS errors introduced

### New Functionality Works

- [ ]  Run `pnpm drizzle-kit generate` → Migration files created in db/migrations/
- [ ]  Run `pnpm drizzle-kit migrate` (or push) → All tables created in Neon database
- [ ]  Run `pnpm drizzle-kit studio` → Drizzle Studio opens in browser
- [ ]  Verify users table → Contains all 9 columns (id, email, username, passwordHash, bio, profilePictureUrl, isAdmin, emailVerified, createdAt)
- [ ]  Verify posts table → Contains all 7 columns including foreign key to users
- [ ]  Verify comments table → Contains all 5 columns including foreign keys
- [ ]  Verify likes table → Contains all 4 columns with composite unique constraint
- [ ]  Verify follows table → Contains all 4 columns with composite unique constraint
- [ ]  Verify otp_codes table → Contains all 5 columns
- [ ]  Check indexes → username_idx, email_idx, posts_user_id_idx visible in Drizzle Studio
- [ ]  Import db client in test file → TypeScript shows auto-generated types for tables
- [ ]  Run simple query → [db.select](http://db.select)().from(users) executes without connection error

### Edge Cases

- [ ]  Change DATABASE_URL to invalid string → Clear error message about connection
- [ ]  Delete migration folder and regenerate → Same migration recreated
- [ ]  Try to insert duplicate email → Unique constraint violation error
- [ ]  Try to insert duplicate username → Unique constraint violation error
- [ ]  Try to insert like with same postId+userId twice → Unique constraint violation
- [ ]  Delete user in Drizzle Studio → Related posts, comments, likes auto-deleted (CASCADE)

## Reference Links

- Drizzle ORM Docs: https://orm.drizzle.team/docs/overview
- Drizzle PostgreSQL Column Types: https://orm.drizzle.team/docs/column-types/pg
- Neon PostgreSQL: https://neon.tech/docs/introduction
- Drizzle Kit CLI: https://orm.drizzle.team/kit-docs/overview

---

# Chunk 3: 🏗️ shadcn/ui & Environment Setup

Duration: 1-2 hours | Prerequisites: Chunk 1 completed (TypeScript and Tailwind CSS configured)

## Quick Reference

**Builds:** shadcn/ui component library configured and ready to use, plus complete environment variable structure with examples.

**Connects:** shadcn CLI → Installs component system → Outputs reusable UI components in components/ui/

**Pattern:** shadcn/ui copy-paste component pattern (not a package dependency) with Radix UI primitives

**Watch For:**

1. components.json config conflicts with existing Tailwind setup
2. CSS variables not defined in globals.css causing component styling to break
3. Environment variable template missing required keys

## Context

### User Problem

Developers need a pre-built component library for rapid UI development and a clear environment variable structure to avoid configuration errors.

### From Module Brief

- **shadcn/ui setup**: Component library must be configured for Button, Card, Avatar, Input, Textarea, Skeleton, Toast, Dialog, Alert Dialog components
- **Environment variables**: Template must exist with all required keys for database, R2, email service, JWT
- **Development ready**: Setup complete enough to start building authentication UI immediately

## What's Changing

### New Additions

- **shadcn/ui configuration**: components.json file defining component paths, styling approach, TypeScript settings, and Tailwind integration
- **CSS variables**: Color scheme and spacing variables in globals.css following shadcn's design system
- **Utility functions**: cn() helper function for conditional Tailwind class merging using clsx and tailwind-merge
- **.env.local file**: Environment variable template with placeholder values for all services
- **.env.example file**: Committed template showing required variables without sensitive values
- **Type definitions for env**: TypeScript definitions for process.env to catch missing variables at compile time

### Modifications to Existing

- **Tailwind config**: Extended with shadcn's color tokens and animation utilities
- **globals.css**: Expanded with CSS custom properties for theming
- **TypeScript config**: May need to include components/ui in paths if not already

### No Changes To

- **Next.js config**: shadcn doesn't require Next.js configuration changes
- **Database schema**: Environment setup is independent of schema

## Data Flow

### shadcn/ui Initialization Flow

1. Developer runs npx shadcn-ui@latest init command
2. CLI prompts for configuration choices (TypeScript: yes, styling: Tailwind, etc.)
3. CLI creates components.json with chosen configuration
4. CLI updates tailwind.config with shadcn's color system
5. CLI adds CSS variables to globals.css
6. CLI creates lib/utils.ts with cn() function
- If successful → shadcn ready, can install components
- If error → Configuration conflict with existing setup
1. Final state: shadcn configured, ready to add components

### Component Installation Flow

1. Developer runs npx shadcn-ui@latest add button (or other component)
2. CLI downloads component source code
3. CLI places component in components/ui/ directory
4. Component includes TypeScript types and Radix UI primitives
- If successful → Component available for import
- If error → Missing dependencies (Radix packages not installed)
1. Final state: Reusable component ready to use in pages

### Environment Variable Loading Flow

1. Application starts, Next.js loads .env.local file
2. Variables become available via process.env
3. Type definitions ensure required variables exist
4. Components and Server Actions access variables
- If variable missing → Runtime error or type error depending on implementation
- If variable present → Application accesses config value
1. Final state: Application configured with environment-specific values

## Things to Watch For

**shadcn init overwrites Tailwind config** → Custom Tailwind settings lost → Run shadcn init immediately after Tailwind setup before adding custom config, or merge carefully

**CSS variables scope incorrect** → Components don't pick up theme colors → CSS variables must be defined on :root selector, not body or other elements

**Dark mode variables not defined** → Dark mode breaks when added later → shadcn includes .dark selector variables, keep them even if not using dark mode initially

**cn() utility not working** → Conditional classes don't apply → Must install clsx and tailwind-merge dependencies, verify lib/utils.ts exports cn function

**Component import paths wrong** → Module not found errors → shadcn components must be imported from '@/components/ui/button' format, verify @ alias works

**Radix UI dependencies missing** → Components throw runtime errors → Each shadcn component includes Radix primitives, npx shadcn-ui add auto-installs them, but verify in package.json

**Environment variables not typed** → No compile-time validation → Create env.d.ts file declaring process.env variables with required types

**Sensitive data committed to git** → Secrets exposed in repository → Verify .env.local in .gitignore, only commit .env.example with placeholder values

**.env.example out of sync** → New developers missing config → Update .env.example whenever adding new required variables

**NEXT_PUBLIC_ prefix misused** → Secrets exposed to client or public vars not available → Only client-accessible variables need NEXT_PUBLIC_ prefix, server-only secrets (DATABASE_URL, JWT_SECRET) should NOT have prefix

**Database URL format wrong** → Connection fails with cryptic error → Neon format is postgresql://user:password@host/database?sslmode=require, document in .env.example

**JWT secret too weak** → Tokens easily compromised → Generate strong random string (64+ characters), document generation method in .env.example

**Environment variables accessed incorrectly in client components** → Undefined values in browser → Client components can only access NEXT_PUBLIC_ prefixed variables, server-only vars return undefined

**Missing environment validation** → App starts with invalid config → Consider adding startup validation that checks all required env vars exist and are valid format

**Port conflicts** → Dev server won't start → Default Next.js port is 3000, document how to change with PORT env var if needed

**shadcn components.json path config** → Components installed in wrong location → Verify paths.ui in components.json points to components/ui, not lib/ui or other location

**Alias resolution in components.json** → Import paths don't match TypeScript config → Ensure @/components in components.json matches @ alias in tsconfig paths

**Button component variant types** → TypeScript errors when using variants → shadcn uses class-variance-authority (CVA), verify it's installed for variant prop types

**Toast component not wired up** → Toast notifications don't appear → Toast requires provider component in root layout, document this in component installation notes

**Dialog component z-index issues** → Overlays behind other content → Verify Tailwind config includes correct z-index scale for overlays

**Form components not installed** → Auth forms need to rebuild everything → Install form-related components (Input, Textarea, Button, Alert) all at once before building auth UI

**Color contrast accessibility** → Failed WCAG standards → shadcn default colors may need adjustment, test with accessibility tools

**Icon library not chosen** → Inconsistent icon usage → Decide on icon library (lucide-react recommended with shadcn), install and document

**Font not optimized** → FOUT (flash of unstyled text) → Use next/font to optimize web font loading, integrate with Tailwind config

**Responsive breakpoints unclear** → Mobile layout guesswork → Document Tailwind breakpoints (sm, md, lg, xl) in project README

**Animation utilities not configured** → Components don't animate → Verify Tailwind config includes animate-* utilities from shadcn setup

**Globals.css import order** → Tailwind layers override custom CSS → Ensure @tailwind directives come before custom CSS, use @layer utilities for custom Tailwind extensions

**Component customization approach** → Developers modify components/ui files directly → Document that components/ui files CAN be edited (that's shadcn's philosophy), not like node_modules

**Missing loading states** → Skeleton component not installed → Install Skeleton component early, needed for feed loading states

**Toast placement** → Notifications obscure important UI → Configure Toast position (top-right, bottom-center, etc.) in Toaster component

**Environment variable naming convention** → Inconsistent naming causes confusion → Use SCREAMING_SNAKE_CASE for all env vars, prefix by service (DATABASE_URL, R2_ACCESS_KEY, etc.)

**Multiple environment files** → Wrong environment loaded → Next.js loads .env.local over .env, document precedence for team

**Build-time vs runtime variables** → Some variables baked into bundle → Next.js inlines NEXT_PUBLIC_ vars at build time, changing them requires rebuild

**Vercel environment variable sync** → Local and production env out of sync → Document that Vercel env vars must be set in dashboard, not just .env.local

## Testing Verification

### Existing Features Still Work

- [ ]  Next.js app runs → No errors from shadcn installation
- [ ]  Tailwind classes still apply → Custom Tailwind config not broken
- [ ]  TypeScript compiles → No new errors from component types

### New Functionality Works

- [ ]  Run `npx shadcn-ui@latest init` → components.json created
- [ ]  Run `npx shadcn-ui@latest add button` → Button component appears in components/ui/
- [ ]  Import Button in test page → TypeScript recognizes import
- [ ]  Use Button with variant prop → TypeScript shows available variants (default, destructive, outline, etc.)
- [ ]  Test cn() utility → Conditional classes merge correctly
- [ ]  Check globals.css → CSS variables for colors defined on :root
- [ ]  Verify .env.local exists → Contains DATABASE_URL and other placeholders
- [ ]  Verify .env.example exists → Committed to git with no sensitive values
- [ ]  Check .gitignore → .env.local is listed
- [ ]  Test env variable access → process.env.DATABASE_URL accessible in Server Action
- [ ]  Test public env variable → [process.env.NEXT](http://process.env.NEXT)_PUBLIC_APP_URL accessible in client component

### Edge Cases

- [ ]  Install same component twice → shadcn warns about overwrite
- [ ]  Use Button with invalid variant → TypeScript error
- [ ]  Access NEXT_PUBLIC_ var in client → Value available in browser
- [ ]  Access non-public var in client → Returns undefined
- [ ]  Delete .env.local → App shows clear error about missing DATABASE_URL
- [ ]  Invalid CSS variable syntax → Component styling falls back gracefully

## Reference Links

- shadcn/ui Docs: https://ui.shadcn.com/docs
- shadcn/ui Installation: https://ui.shadcn.com/docs/installation/next
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- Radix UI Primitives: https://www.radix-ui.com/primitives

---

## Feature Acceptance Tests

**From Module Brief QA Criteria:**

Run these after all chunks complete to verify the full feature works.

**Core Tests:**

- [ ]  Run `pnpm dev` → App starts on [localhost:3000](http://localhost:3000) with no console errors
- [ ]  Run `pnpm drizzle-kit studio` → Drizzle Studio opens showing all 6 tables
- [ ]  Check users table → Contains all columns: id, email, username, passwordHash, bio, profilePictureUrl, isAdmin, emailVerified, createdAt
- [ ]  Check database indexes → username_idx, email_idx, posts_user_id_idx exist
- [ ]  Change environment variable to invalid value → App shows clear error message
- [ ]  Test TypeScript strict mode → Open tsconfig.json, verify "strict": true
- [ ]  Test shadcn/ui → Import Button component, renders without errors
- [ ]  Run `pnpm build` → Production build completes successfully
- [ ]  Verify project structure → app/, components/, lib/, db/ folders exist with proper organization

**Edge Cases:**

- [ ]  Delete .next folder and restart → Rebuilds successfully
- [ ]  Create component with TypeScript error → Build fails with clear error message
- [ ]  Try to insert duplicate email in database → Unique constraint violation
- [ ]  Delete user from Drizzle Studio → Related posts/comments auto-deleted (CASCADE works)

**Integration:**

- [ ]  Full dev workflow → Make schema change, generate migration, apply migration, verify in Drizzle Studio
- [ ]  Environment variable flow → Add new var to .env.local, access in code, TypeScript recognizes type
- [ ]  Component import flow → Install shadcn component, import in page, use with props, renders correctly

---

**Module Status:** ✅ Ready for implementation

**Next Module:** Module 2 - Core Authentication System
