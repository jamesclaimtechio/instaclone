import { db, users, posts, comments, likes, follows } from './index';
import { hash } from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Create sample users
    console.log('Creating users...');
    const userResults = await db
      .insert(users)
      .values([
        {
          email: 'admin@instagram.com',
          username: 'admin',
          passwordHash: await hash('admin123', 12),
          bio: 'System Administrator',
          isAdmin: true,
          emailVerified: true,
        },
        {
          email: 'alice@example.com',
          username: 'alice_wonder',
          passwordHash: await hash('password123', 12),
          bio: '📸 Photography enthusiast | Travel lover ✈️',
          emailVerified: true,
        },
        {
          email: 'bob@example.com',
          username: 'bob_builder',
          passwordHash: await hash('password123', 12),
          bio: 'Building cool stuff 🛠️ | Tech geek 💻',
          emailVerified: true,
        },
      ])
      .returning();

    const [admin, alice, bob] = userResults;
    if (!admin || !alice || !bob) {
      throw new Error('Failed to create users');
    }

    console.log(`✓ Created ${3} users`);
    console.log(`  - ${admin.username} (admin)`);
    console.log(`  - ${alice.username}`);
    console.log(`  - ${bob.username}\n`);

    // Create sample posts
    console.log('Creating posts...');
    const postResults = await db
      .insert(posts)
      .values([
        {
          userId: alice.id,
          imageUrl: 'https://placehold.co/1200x1200/e0e0e0/666?text=Alice+Post+1',
          thumbnailUrl: 'https://placehold.co/400x400/e0e0e0/666?text=Alice+Post+1',
          blurHash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
          caption: 'Beautiful sunset at the beach 🌅 #nature #photography',
        },
        {
          userId: alice.id,
          imageUrl: 'https://placehold.co/1200x1200/d0d0d0/555?text=Alice+Post+2',
          thumbnailUrl: 'https://placehold.co/400x400/d0d0d0/555?text=Alice+Post+2',
          blurHash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
          caption: 'Coffee and code ☕️💻',
        },
        {
          userId: bob.id,
          imageUrl: 'https://placehold.co/1200x1200/c0c0c0/444?text=Bob+Post+1',
          thumbnailUrl: 'https://placehold.co/400x400/c0c0c0/444?text=Bob+Post+1',
          blurHash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
          caption: 'New project launch! 🚀',
        },
        {
          userId: bob.id,
          imageUrl: 'https://placehold.co/1200x1200/b0b0b0/333?text=Bob+Post+2',
          thumbnailUrl: 'https://placehold.co/400x400/b0b0b0/333?text=Bob+Post+2',
          blurHash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.',
          caption: 'Weekend vibes 😎',
        },
        {
          userId: admin.id,
          imageUrl: 'https://placehold.co/1200x1200/a0a0a0/222?text=Admin+Post',
          thumbnailUrl: 'https://placehold.co/400x400/a0a0a0/222?text=Admin+Post',
          blurHash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
          caption: 'Welcome to our community! 👋',
        },
      ])
      .returning();

    const [post1, post2, post3, post4, post5] = postResults;
    if (!post1 || !post2 || !post3 || !post4 || !post5) {
      throw new Error('Failed to create posts');
    }

    console.log(`✓ Created ${5} posts\n`);

    // Create sample comments
    console.log('Creating comments...');
    await db.insert(comments).values([
      {
        postId: post1.id,
        userId: bob.id,
        text: 'Amazing shot! 📸',
      },
      {
        postId: post1.id,
        userId: admin.id,
        text: 'Love the colors!',
      },
      {
        postId: post3.id,
        userId: alice.id,
        text: 'Congratulations! 🎉',
      },
      {
        postId: post5.id,
        userId: alice.id,
        text: 'Thanks for creating this!',
      },
    ]);

    console.log(`✓ Created ${4} comments\n`);

    // Create sample likes
    console.log('Creating likes...');
    await db.insert(likes).values([
      { postId: post1.id, userId: bob.id },
      { postId: post1.id, userId: admin.id },
      { postId: post2.id, userId: bob.id },
      { postId: post3.id, userId: alice.id },
      { postId: post3.id, userId: admin.id },
      { postId: post4.id, userId: alice.id },
      { postId: post5.id, userId: alice.id },
      { postId: post5.id, userId: bob.id },
    ]);

    console.log(`✓ Created ${8} likes\n`);

    // Create sample follows
    console.log('Creating follows...');
    await db.insert(follows).values([
      { followerId: alice.id, followingId: bob.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: admin.id, followingId: alice.id },
      { followerId: admin.id, followingId: bob.id },
    ]);

    console.log(`✓ Created ${4} follows\n`);

    console.log('✅ Database seeded successfully!\n');
    console.log('Sample credentials:');
    console.log('  Admin: admin@instagram.com / admin123');
    console.log('  Alice: alice@example.com / password123');
    console.log('  Bob: bob@example.com / password123\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seed;

