import { pgTable, text, uuid, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    bio: text('bio'),
    profilePictureUrl: text('profile_picture_url'),
    isAdmin: boolean('is_admin').notNull().default(false),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    usernameIdx: index('idx_users_username').on(table.username),
    emailIdx: index('idx_users_email').on(table.email),
  })
);

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================================================
// POSTS TABLE
// ============================================================================
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    thumbnailUrl: text('thumbnail_url').notNull(),
    blurHash: text('blur_hash').notNull(),
    caption: text('caption'), // Nullable, unlimited length per spec
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_posts_user_id').on(table.userId),
    createdAtIdx: index('idx_posts_created_at').on(table.createdAt),
  })
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// ============================================================================
// COMMENTS TABLE
// ============================================================================
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    postIdIdx: index('idx_comments_post_id').on(table.postId),
  })
);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

// ============================================================================
// LIKES TABLE
// ============================================================================
export const likes = pgTable(
  'likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    postIdIdx: index('idx_likes_post_id').on(table.postId),
    // Composite unique constraint: one user can only like a post once
    uniqueUserPostLike: unique('unique_user_post_like').on(table.postId, table.userId),
  })
);

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;

// ============================================================================
// FOLLOWS TABLE
// ============================================================================
export const follows = pgTable(
  'follows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    followerIdIdx: index('idx_follows_follower_id').on(table.followerId),
    followingIdIdx: index('idx_follows_following_id').on(table.followingId),
    // Composite unique constraint: one user can only follow another user once
    uniqueFollowerFollowing: unique('unique_follower_following').on(
      table.followerId,
      table.followingId
    ),
  })
);

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;

// ============================================================================
// OTP_CODES TABLE
// ============================================================================
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull(), // Stored as text to preserve leading zeros
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_otp_codes_user_id').on(table.userId),
    expiresAtIdx: index('idx_otp_codes_expires_at').on(table.expiresAt),
  })
);

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;

