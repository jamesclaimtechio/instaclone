# Quick Start

## Prerequisites

- **Node.js** 18+ installed ([nodejs.org](http://nodejs.org))
- **pnpm** installed: `npm install -g pnpm`
- **Git** installed
- **Cloudflare account** (free tier)
- **Neon account** (free tier)
- **Resend account** (free tier)
- **Domain name** (optional but recommended for email)
- **Code editor** (VS Code recommended with Tailwind CSS IntelliSense extension)

---

## Setup

### 1. Clone or Create Project

```bash
# Create new Next.js project
pnpm create next-app@latest instagram-clone

# Select options:
# ✅ TypeScript
# ✅ ESLint  
# ✅ Tailwind CSS
# ✅ App Router
# ❌ src/ directory (optional, choose based on preference)
# ✅ Import alias (@/*)

cd instagram-clone
```

### 2. Install Dependencies

```bash
# Core dependencies
pnpm add drizzle-orm postgres @aws-sdk/client-s3 sharp bcrypt jose resend date-fns

# Dev dependencies
pnpm add -D drizzle-kit @types/bcrypt

# shadcn/ui setup
pnpm dlx shadcn@latest init
# Select:
# Style: Default
# Base color: Slate (or your preference)
# CSS variables: Yes

# Install shadcn components
pnpm dlx shadcn@latest add button card avatar input textarea skeleton toast dialog alert-dialog
```

### 3. Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your actual values
# See ENV_SETUP for detailed instructions
```

**Minimal .env.local to get started:**

```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=generate_with_openssl_rand_base64_32
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add R2 and Resend later when implementing those modules
```

### 4. Database Setup

Create database schema file:

```tsx
// src/db/schema.ts
// See DATABASE_SCHEMA for complete schema
```

Create Drizzle config:

```tsx
// drizzle.config.ts
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Generate and run migrations:

```bash
# Generate migration from schema
pnpm drizzle-kit generate

# Apply migration to database  
pnpm drizzle-kit migrate

# Open Drizzle Studio to verify
pnpm drizzle-kit studio
```

### 5. Configure Middleware

Create authentication middleware:

```tsx
// src/middleware.ts
// See ARCHITECTURE for middleware pattern
// Protect routes that require authentication
```

### 6. Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

---

## First Run

### Start Development Server

```bash
pnpm dev
```

App should start on http://localhost:3000

You should see:

- No errors in terminal
- Next.js compiled successfully
- App accessible in browser

### Open Drizzle Studio (in separate terminal)

```bash
pnpm db:studio
```

Should open [localhost:4983](http://localhost:4983) with database GUI.

---

## Verify It Works

### Check Database Connection

1. Open Drizzle Studio: 109
2. You should see all 6 tables:
    - users
    - posts
    - comments
    - likes
    - follows
    - otp_codes
3. Click on any table - should load without errors

### Check Environment Variables

1. Add temporary test page:

```tsx
// app/test/page.tsx
export default function TestPage() {
  return (
    <div>
      <p>Database: {process.env.DATABASE_URL ? '✅ Connected' : '❌ Missing'}</p>
      <p>JWT Secret: {process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}</p>
    </div>
  );
}
```

1. Visit http://localhost:3000
2. Should show checkmarks for configured vars
3. Delete test page after verification

### Check TypeScript

```bash
pnpm tsc --noEmit
```

Should complete with no errors.

### Check Tailwind CSS

Create test component:

```tsx
// app/page.tsx
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Instagram Clone</h1>
        <p className="mt-2 text-gray-600">Setup complete! ✨</p>
      </div>
    </div>
  );
}
```

Visit http://localhost:3000 - should see styled card.

---

## Next Steps

### Implementation Order

1. **Module 1: Complete database schema** (if not done yet)
    - Define all 6 tables in `src/db/schema.ts`
    - Generate and run migrations
    - Verify in Drizzle Studio
2. **Module 2: Build authentication**
    - Registration page
    - Login page
    - JWT generation and validation
    - Middleware for protected routes
3. **Module 3: Email verification**
    - Set up Resend account
    - OTP generation and validation
    - Email templates
4. **Continue with modules 4-13**
    - Follow BUILD ROADMAP order
    - Each module has detailed implementation guide
    - Use TASK_ROUTER to navigate

### Development Workflow

1. **Pick a module** from Build Roadmap
2. **Read module brief** to understand requirements
3. **Check TASK_ROUTER** for similar tasks
4. **Review relevant docs:**
    - DATABASE_SCHEMA for data changes
    - ARCHITECTURE for patterns
    - .cursorrules for constraints
5. **Implement features**
6. **Test thoroughly** (each module has test criteria)
7. **Commit and move to next module**

### Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm db:studio        # Open database GUI
pnpm lint             # Check for errors

# Database
pnpm db:generate      # Generate migration from schema changes
pnpm db:push          # Push schema changes directly (dev only)
pnpm db:migrate       # Run pending migrations

# Type checking
pnpm tsc --noEmit     # Check TypeScript errors

# Building
pnpm build            # Build for production
pnpm start            # Start production server
```

---

## Common First-Time Issues

### "Cannot find module 'drizzle-orm'"

**Fix:** Run `pnpm install` again. If still broken, delete `node_modules` and `pnpm-lock.yaml`, then reinstall.

### "Database connection refused"

**Fix:** Verify DATABASE_URL in .env.local. Check Neon project isn't paused (free tier auto-pauses after inactivity).

### "Tailwind classes not working"

**Fix:** Restart dev server. Tailwind needs restart to pick up new config.

### "Sharp module not found in production"

**Fix:** Ensure `sharp` is in `dependencies`, not `devDependencies` in package.json.

---

## Getting Help

1. **Check TROUBLESHOOTING** for specific errors
2. **Review module documentation** - each module has extensive "Things to Watch For"
3. **Search TASK_ROUTER** for related tasks
4. **Check ARCHITECTURE** for design patterns
5. **Verify DATABASE_SCHEMA** matches implementation

---

## Project Structure (After Setup)

```
instagram-clone/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth routes (login, register)
│   │   ├── (main)/          # Protected routes (feed, profile)
│   │   ├── admin/           # Admin dashboard
│   │   ├── actions/         # Server Actions by feature
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── posts/           # Post components
│   │   ├── profile/         # Profile components
│   │   └── feed/            # Feed components
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema
│   │   ├── index.ts         # Database client
│   │   └── migrations/      # Generated migrations
│   ├── lib/
│   │   ├── auth.ts          # Auth utilities
│   │   ├── r2.ts            # R2 client
│   │   ├── image.ts         # Sharp processing
│   │   └── utils.ts         # Shared utilities
│   └── middleware.ts        # Auth middleware
├── .env.local              # Environment variables (not committed)
├── .env.example            # Example env file (committed)
├── drizzle.config.ts       # Drizzle configuration
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

---

**You're ready to build! 🚀**

Start with Module 1 and follow the Build Roadmap. Each module builds on the previous ones, creating a complete Instagram clone by Module 13.
