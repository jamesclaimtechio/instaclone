import { ProfileStats as ProfileStatsType } from '@/lib/profile';

interface ProfileStatsProps {
  stats: ProfileStatsType;
}

/**
 * Displays follower, following, and posts counts with proper singular/plural
 */
export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="flex items-center gap-6 sm:gap-8">
      <StatItem count={stats.posts} label="post" />
      <StatItem count={stats.followers} label="follower" />
      <StatItem count={stats.following} label="following" />
    </div>
  );
}

interface StatItemProps {
  count: number;
  label: string;
}

function StatItem({ count, label }: StatItemProps) {
  // Handle singular/plural for posts and followers
  // "following" doesn't change
  const displayLabel = label === 'following' 
    ? label 
    : count === 1 
      ? label 
      : `${label}s`;

  return (
    <div className="text-center sm:text-left">
      <span className="font-semibold text-lg">{count.toLocaleString()}</span>
      <span className="text-gray-600 ml-1">{displayLabel}</span>
    </div>
  );
}

