import Image from 'next/image';
import Link from 'next/link';
import { ProfileUser, ProfileStats as ProfileStatsType, getAvatarUrl } from '@/lib/profile';
import ProfileStats from './profile-stats';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface ProfileHeaderProps {
  user: ProfileUser;
  stats: ProfileStatsType;
  isOwnProfile: boolean;
}

/**
 * Profile header component displaying avatar, username, bio, stats, and action buttons
 */
export default function ProfileHeader({ user, stats, isOwnProfile }: ProfileHeaderProps) {
  const avatarUrl = getAvatarUrl(user.profilePictureUrl, user.username);

  return (
    <header className="w-full">
      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar - Medium on mobile */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={avatarUrl}
              alt={`${user.username}'s profile picture`}
              fill
              className="rounded-full object-cover border-2 border-gray-200"
              priority
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Username */}
            <h1 className="text-xl font-semibold truncate">{user.username}</h1>
            
            {/* Action Button */}
            <div className="mt-2">
              {isOwnProfile ? (
                <Link href={`/profile/${user.username}/edit`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <Button variant="default" size="sm" className="w-full" disabled>
                  Follow
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Bio */}
        <div className="mb-4">
          {user.bio ? (
            <p className="text-sm whitespace-pre-wrap break-words">{user.bio}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No bio yet</p>
          )}
        </div>
        
        {/* Stats - Stacked on mobile */}
        <div className="border-t border-b py-3">
          <ProfileStats stats={stats} />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex gap-8 lg:gap-16 items-start">
        {/* Avatar - Large on desktop */}
        <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0">
          <Image
            src={avatarUrl}
            alt={`${user.username}'s profile picture`}
            fill
            className="rounded-full object-cover border-2 border-gray-200"
            priority
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Username and Action Button Row */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="text-2xl font-light">{user.username}</h1>
            
            {isOwnProfile ? (
              <Link href={`/profile/${user.username}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <Button variant="default" size="sm" disabled>
                Follow
              </Button>
            )}
          </div>

          {/* Stats Row */}
          <div className="mb-4">
            <ProfileStats stats={stats} />
          </div>

          {/* Bio */}
          <div>
            {user.bio ? (
              <p className="text-sm whitespace-pre-wrap break-words max-w-md">{user.bio}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No bio yet</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

