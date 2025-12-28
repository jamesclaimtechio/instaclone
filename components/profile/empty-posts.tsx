import { Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyPostsProps {
  isOwnProfile: boolean;
  username: string;
}

/**
 * Empty state shown when a profile has no posts
 * Shows different messages for own profile vs others
 */
export default function EmptyPosts({ isOwnProfile, username }: EmptyPostsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full border-2 border-gray-900 flex items-center justify-center mb-4">
        <Camera className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
      </div>
      
      {isOwnProfile ? (
        <>
          <h2 className="text-2xl font-bold mb-2">Share Photos</h2>
          <p className="text-gray-500 mb-4 max-w-xs">
            When you share photos, they will appear on your profile.
          </p>
          <Link href="/create">
            <Button>Share your first photo</Button>
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-2">No Posts Yet</h2>
          <p className="text-gray-500 max-w-xs">
            When {username} shares photos, they will appear here.
          </p>
        </>
      )}
    </div>
  );
}

