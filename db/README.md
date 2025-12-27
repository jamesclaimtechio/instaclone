# Database Setup Guide

This guide explains how to set up and manage the database for the Instagram Clone project.

## 📋 Prerequisites

- [Neon PostgreSQL](https://neon.tech/) account (free tier available)
- pnpm package manager installed
- Environment variables configured

---

## 🚀 Quick Start

### 1. Create a Neon Database

1. Go to [console.neon.tech](https://console.neon.tech/)
2. Sign up or log in
3. Click "Create Project"
4. Choose a project name (e.g., "instagram-clone")
5. Select a region closest to you
6. Copy the connection string

### 2. Configure Environment Variables

Add your database connection string to `.env.local`:

```bash
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

**Important:** Replace the placeholder with your actual Neon connection string.

### 3. Push Schema to Database

For development, use the push command (faster, no migration files):

```bash
pnpm db:push
```

Or, for production-ready migrations:

```bash
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply migrations to database
```

### 4. Seed Sample Data (Optional)

Populate your database with test data:

```bash
pnpm db:seed
```

This creates:
- 3 users (admin, alice_wonder, bob_builder)
- 5 posts with images
- 4 comments
- 8 likes
- 4 follow relationships

**Sample Credentials:**
- Admin: `admin@instagram.com` / `admin123`
- Alice: `alice@example.com` / `password123`
- Bob: `bob@example.com` / `password123`

---

## 📊 Database Schema

The database consists of 6 tables:

### users
- `id` (uuid, primary key)
- `email` (text, unique, not null)
- `username` (text, unique, not null)
- `passwordHash` (text, not null)
- `bio` (text, nullable)
- `profilePictureUrl` (text, nullable)
- `isAdmin` (boolean, default: false)
- `emailVerified` (boolean, default: false)
- `createdAt` (timestamp, default: now)

### posts
- `id` (uuid, primary key)
- `userId` (uuid, foreign key → users.id, CASCADE)
- `imageUrl` (text, not null)
- `thumbnailUrl` (text, not null)
- `blurHash` (text, not null)
- `caption` (text, nullable, unlimited length)
- `createdAt` (timestamp, default: now)

### comments
- `id` (uuid, primary key)
- `postId` (uuid, foreign key → posts.id, CASCADE)
- `userId` (uuid, foreign key → users.id, CASCADE)
- `text` (text, not null)
- `createdAt` (timestamp, default: now)

### likes
- `id` (uuid, primary key)
- `postId` (uuid, foreign key → posts.id, CASCADE)
- `userId` (uuid, foreign key → users.id, CASCADE)
- `createdAt` (timestamp, default: now)
- **Unique constraint:** (postId, userId) - prevents duplicate likes

### follows
- `id` (uuid, primary key)
- `followerId` (uuid, foreign key → users.id, CASCADE)
- `followingId` (uuid, foreign key → users.id, CASCADE)
- `createdAt` (timestamp, default: now)
- **Unique constraint:** (followerId, followingId) - prevents duplicate follows

### otp_codes
- `id` (uuid, primary key)
- `userId` (uuid, foreign key → users.id, CASCADE)
- `code` (text, not null) - stored as text to preserve leading zeros
- `expiresAt` (timestamp, not null)
- `createdAt` (timestamp, default: now)

---

## 🛠️ Available Commands

### Development

```bash
# Push schema changes directly to database (fast, no migration files)
pnpm db:push

# Open Drizzle Studio (visual database browser)
pnpm db:studio
```

### Production

```bash
# Generate migration files from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate
```

### Data Management

```bash
# Seed database with sample data
pnpm db:seed
```

---

## 🔍 Drizzle Studio

Drizzle Studio is a visual database browser that lets you:
- View all tables and data
- Edit records directly
- Test queries
- Inspect relationships

To open Drizzle Studio:

```bash
pnpm db:studio
```

Then visit `https://local.drizzle.studio` in your browser.

---

## ⚠️ Important Notes

### CASCADE Deletes

All foreign keys are configured with `ON DELETE CASCADE`:
- Deleting a user → deletes all their posts, comments, likes, follows, and OTP codes
- Deleting a post → deletes all its comments and likes

This ensures data integrity and prevents orphaned records.

### Composite Unique Constraints

- **likes table:** A user can only like a post once (postId + userId must be unique)
- **follows table:** A user can only follow another user once (followerId + followingId must be unique)

### UUID Primary Keys

All tables use UUID v4 for primary keys (not auto-incrementing integers). This provides:
- Better distribution across sharded databases
- No collision risk when merging data
- Harder to guess/enumerate

### Indexes

Performance indexes are created on:
- `users.username` - for search and profile lookups
- `users.email` - for login and uniqueness checks
- `posts.userId` - for fetching user's posts
- `posts.createdAt` - for feed sorting
- `comments.postId` - for loading post comments
- `likes.postId` - for counting likes
- `follows.followerId` - for follower counts
- `follows.followingId` - for following counts
- `otp_codes.userId` - for OTP lookup
- `otp_codes.expiresAt` - for cleanup queries

---

## 🐛 Troubleshooting

### Connection Error

**Error:** `DATABASE_URL is not defined`

**Solution:** Make sure `.env.local` exists and contains your Neon connection string.

### SSL Certificate Error

**Error:** `SSL certificate verification failed`

**Solution:** Ensure your connection string includes `?sslmode=require` at the end.

### Migration Conflicts

**Error:** `Migration already applied`

**Solution:** 
1. Check `db/migrations/` for duplicate files
2. Delete conflicting migration files
3. Run `pnpm db:generate` again

### Seed Script Fails

**Error:** `Unique constraint violation`

**Solution:** The database already has data. Either:
1. Clear the database manually in Drizzle Studio
2. Modify the seed script to use different values

### Connection Pool Exhausted

**Error:** `Too many connections`

**Solution:** Neon has connection limits on free tier. Make sure:
1. You're using the singleton pattern in `db/index.ts`
2. Not creating new connections per request
3. Consider upgrading Neon plan if needed

---

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit CLI Reference](https://orm.drizzle.team/kit-docs/overview)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)

---

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **Use strong passwords** for database users
3. **Rotate credentials** regularly
4. **Use read-only connections** for analytics/reporting
5. **Enable connection pooling** in production
6. **Monitor query performance** with Neon's dashboard
7. **Set up backups** for production databases

---

**Last Updated:** December 27, 2025  
**Schema Version:** Initial (0000_chunky_tigra)

