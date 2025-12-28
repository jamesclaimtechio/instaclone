import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { getAllPosts, type AdminPost } from '@/lib/admin';
import AdminPagination from '@/components/admin/pagination';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Manage Posts | Admin Dashboard',
  description: 'View and manage all posts',
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

function truncateCaption(caption: string | null, maxLength: number = 100): string {
  if (!caption) return '—';
  if (caption.length <= maxLength) return caption;
  return caption.slice(0, maxLength) + '...';
}

// ============================================================================
// PAGE
// ============================================================================

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  
  const { items: posts, totalCount, totalPages, currentPage } = await getAllPosts(page);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-500 mt-1">
            {totalCount.toLocaleString()} total posts
          </p>
        </div>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
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
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caption
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <PostRow key={post.id} post={post} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/admin/posts"
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
      <p className="text-gray-500">No posts created yet</p>
    </div>
  );
}

function PostRow({ post }: { post: AdminPost }) {
  return (
    <tr className="hover:bg-gray-50">
      {/* Thumbnail */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={`/post/${post.id}`} className="block hover:opacity-80">
          <Image
            src={post.thumbnailUrl}
            alt="Post thumbnail"
            width={50}
            height={50}
            className="rounded object-cover"
          />
        </Link>
      </td>

      {/* Author */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          href={`/profile/${post.author.username}`}
          className="text-gray-900 hover:underline"
        >
          {post.author.username}
        </Link>
      </td>

      {/* Caption */}
      <td className="px-6 py-4">
        <p className="text-gray-600 max-w-xs truncate">
          {truncateCaption(post.caption)}
        </p>
      </td>

      {/* Engagement */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {post.likeCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.commentCount.toLocaleString()}
          </span>
        </div>
      </td>

      {/* Date */}
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {formatDate(post.createdAt)}
      </td>
    </tr>
  );
}

function PostCard({ post }: { post: AdminPost }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Link href={`/post/${post.id}`} className="shrink-0">
          <Image
            src={post.thumbnailUrl}
            alt="Post thumbnail"
            width={64}
            height={64}
            className="rounded object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${post.author.username}`}
            className="font-medium text-gray-900 hover:underline"
          >
            {post.author.username}
          </Link>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {truncateCaption(post.caption, 80)}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.likeCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.commentCount.toLocaleString()}
            </span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

