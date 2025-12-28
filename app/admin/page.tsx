import Link from 'next/link';
import { Users, Image as ImageIcon, MessageSquare, ArrowRight } from 'lucide-react';
import { getAdminStats } from '@/lib/admin';
import { formatCount } from '@/lib/profile.types';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Admin Dashboard | InstaClone',
  description: 'Administrative dashboard for content moderation',
  robots: {
    index: false,
    follow: false,
  },
};

// ============================================================================
// PAGE
// ============================================================================

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome to the admin dashboard. Monitor and manage platform content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Users"
          count={stats.totalUsers}
          icon={Users}
          href="/admin/users"
          color="blue"
        />
        <StatsCard
          title="Total Posts"
          count={stats.totalPosts}
          icon={ImageIcon}
          href="/admin/posts"
          color="green"
        />
        <StatsCard
          title="Total Comments"
          count={stats.totalComments}
          icon={MessageSquare}
          href="/admin/comments"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            title="Manage Users"
            description="View and manage user accounts"
            href="/admin/users"
          />
          <QuickAction
            title="Moderate Posts"
            description="Review and delete posts"
            href="/admin/posts"
          />
          <QuickAction
            title="Review Comments"
            description="Moderate user comments"
            href="/admin/comments"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: 'blue' | 'green' | 'purple';
}

function StatsCard({ title, count, icon: Icon, href, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Link
      href={href}
      className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCount(count)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-gray-700">
        <span>View all</span>
        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
}

function QuickAction({ title, description, href }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
  );
}

