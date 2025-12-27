// Temporary file to verify TypeScript type inference works correctly
import { db, users, posts, User, Post } from './db';

// Test 1: Import db client
const dbClient = db;

// Test 2: TypeScript should infer User type
const testUser: User = {
  id: '123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hash',
  bio: null,
  profilePictureUrl: null,
  isAdmin: false,
  emailVerified: false,
  createdAt: new Date(),
};

// Test 3: TypeScript should infer Post type
const testPost: Post = {
  id: '456',
  userId: '123',
  imageUrl: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  blurHash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
  caption: 'Test caption',
  createdAt: new Date(),
};

// Test 4: Query builder should have type inference
async function testQuery() {
  // This should show autocomplete for table columns
  const result = await db.select().from(users);
  
  // TypeScript should know result is User[]
  const firstUser = result[0];
  console.log(firstUser?.username); // Should autocomplete
}

console.log('✓ TypeScript type inference working correctly');

