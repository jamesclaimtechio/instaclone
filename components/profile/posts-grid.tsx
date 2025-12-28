import { ProfilePost } from '@/lib/profile.types';
import PostThumbnail from './post-thumbnail';
import EmptyPosts from './empty-posts';

interface PostsGridProps {
  posts: ProfilePost[];
  isOwnProfile: boolean;
  username: string;
}

/**
 * Responsive grid of post thumbnails for a user's profile
 * Shows empty state when no posts exist
 */
export default function PostsGrid({ posts, isOwnProfile, username }: PostsGridProps) {
  if (posts.length === 0) {
    return <EmptyPosts isOwnProfile={isOwnProfile} username={username} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
      {posts.map((post) => (
        <PostThumbnail key={post.id} post={post} />
      ))}
    </div>
  );
}

