import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Reusable pagination component for admin lists
 * Uses URL search params to preserve page state on refresh
 */
export default function AdminPagination({
  currentPage,
  totalPages,
  baseUrl,
}: AdminPaginationProps) {
  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Build URLs for navigation
  const previousUrl = hasPrevious
    ? `${baseUrl}?page=${currentPage - 1}`
    : '#';
  const nextUrl = hasNext
    ? `${baseUrl}?page=${currentPage + 1}`
    : '#';

  return (
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      {/* Page Info */}
      <p className="text-sm text-gray-600">
        Page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span>
      </p>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Button asChild variant="outline" size="sm">
            <Link href={previousUrl}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
        )}

        {hasNext ? (
          <Button asChild variant="outline" size="sm">
            <Link href={nextUrl}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

