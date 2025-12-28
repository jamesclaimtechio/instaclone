import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getFullProfile } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import ProfileHeader from '@/components/profile/profile-header';
import PostsGrid from '@/components/profile/posts-grid';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

/**
 * Generate dynamic metadata for SEO and social sharing
 */
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  
  const profile = await getFullProfile(decodedUsername);
  
  if (!profile) {
    return {
      title: 'User Not Found',
    };
  }

  const description = profile.user.bio || `Check out ${profile.user.username}'s profile`;

  return {
    title: `${profile.user.username} | Instagram Clone`,
    description,
    openGraph: {
      title: `${profile.user.username}`,
      description,
      type: 'profile',
    },
  };
}

/**
 * Profile page Server Component
 * Displays user profile with avatar, stats, bio, and posts grid
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  
  // Get current user for ownership detection
  const currentUser = await getCurrentUser();
  
  // Fetch complete profile data
  const profile = await getFullProfile(decodedUsername, currentUser?.userId);
  
  // Handle non-existent user
  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader
          user={profile.user}
          stats={profile.stats}
          isOwnProfile={profile.isOwnProfile}
        />

        {/* Divider */}
        <div className="border-t my-8" />

        {/* Posts Grid */}
        <PostsGrid
          posts={profile.posts.posts}
          isOwnProfile={profile.isOwnProfile}
          username={profile.user.username}
        />
      </div>
    </main>
  );
}

