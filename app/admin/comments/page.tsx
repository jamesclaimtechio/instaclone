import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getAllComments, type AdminComment } from '@/lib/admin';
import AdminPagination from '@/components/admin/pagination';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Manage Comments | Admin Dashboard',
  description: 'View and manage all comments',
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

function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function getPostPreview(caption: string | null): string {
  if (!caption) return 'View post';
  if (caption.length > 30) return caption.slice(0, 30) + '...';
  return caption;
}

// ============================================================================
// PAGE
// ============================================================================

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  
  const { items: comments, totalCount, totalPages, currentPage } = await getAllComments(page);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comments</h1>
          <p className="text-gray-500 mt-1">
            {totalCount.toLocaleString()} total comments
          </p>
        </div>
      </div>

      {/* Comments Table */}
      {comments.length === 0 ? (
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
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comments.map((comment) => (
                    <CommentRow key={comment.id} comment={comment} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/admin/comments"
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
      <p className="text-gray-500">No comments posted yet</p>
    </div>
  );
}

function CommentRow({ comment }: { comment: AdminComment }) {
  return (
    <tr className="hover:bg-gray-50">
      {/* Author */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          href={`/profile/${comment.author.username}`}
          className="font-medium text-gray-900 hover:underline"
        >
          {comment.author.username}
        </Link>
      </td>

      {/* Comment Text */}
      <td className="px-6 py-4">
        <p className="text-gray-600 max-w-md">
          {truncateText(comment.text)}
        </p>
      </td>

      {/* Post Link */}
      <td className="px-6 py-4 whitespace-nowrap">
        {comment.post.id ? (
          <Link
            href={`/post/${comment.post.id}`}
            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
          >
            {getPostPreview(comment.post.caption)}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="text-gray-400 text-sm">[deleted]</span>
        )}
      </td>

      {/* Date */}
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {formatDate(comment.createdAt)}
      </td>
    </tr>
  );
}

function CommentCard({ comment }: { comment: AdminComment }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/profile/${comment.author.username}`}
          className="font-medium text-gray-900 hover:underline shrink-0"
        >
          {comment.author.username}
        </Link>
        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {truncateText(comment.text, 120)}
      </p>
      {comment.post.id && (
        <Link
          href={`/post/${comment.post.id}`}
          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mt-2"
        >
          View post
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

