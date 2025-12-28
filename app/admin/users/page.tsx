import Link from 'next/link';
import Image from 'next/image';
import { Shield, CheckCircle } from 'lucide-react';
import { getAllUsers, type AdminUser } from '@/lib/admin';
import { getAvatarUrl } from '@/lib/profile.types';
import AdminPagination from '@/components/admin/pagination';
import DeleteUserButton from '@/components/admin/delete-user-button';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Manage Users | Admin Dashboard',
  description: 'View and manage all user accounts',
  robots: {
    index: false,
    follow: false,
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// PAGE
// ============================================================================

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  
  const { items: users, totalCount, totalPages, currentPage } = await getAllUsers(page);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">
            {totalCount.toLocaleString()} total users
          </p>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/admin/users"
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EmptyState() {
  return (
    <div className="bg-white rounded-lg border p-12 text-center">
      <p className="text-gray-500">No users registered yet</p>
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const avatarUrl = getAvatarUrl(user.profilePictureUrl, user.username);

  return (
    <tr className="hover:bg-gray-50">
      {/* User */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <Image
            src={avatarUrl}
            alt={user.username}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-gray-900">{user.username}</p>
            {user.isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
        </Link>
      </td>

      {/* Email */}
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-gray-600">{user.email}</p>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        {user.emailVerified ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Verified
          </span>
        ) : (
          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
            Unverified
          </span>
        )}
      </td>

      {/* Joined */}
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {formatDate(user.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <DeleteUserButton userId={user.id} username={user.username} />
      </td>
    </tr>
  );
}

function UserCard({ user }: { user: AdminUser }) {
  const avatarUrl = getAvatarUrl(user.profilePictureUrl, user.username);

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${user.username}`}>
          <Image
            src={avatarUrl}
            alt={user.username}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${user.username}`}>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">{user.username}</p>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600">
                    <Shield className="h-3 w-3" />
                  </span>
                )}
              </div>
            </Link>
            <DeleteUserButton userId={user.id} username={user.username} />
          </div>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{formatDate(user.createdAt)}</span>
            {user.emailVerified ? (
              <span className="text-green-600">Verified</span>
            ) : (
              <span className="text-yellow-600">Unverified</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

