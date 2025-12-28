'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from './delete-confirmation-modal';
import { adminDeleteComment } from '@/app/actions/admin';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface DeleteCommentButtonProps {
  commentId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DeleteCommentButton({ commentId }: DeleteCommentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await adminDeleteComment(commentId);
      
      if (result.success) {
        toast.success('Comment deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete comment');
        throw new Error(result.error); // Keep modal open
      }
    });
  };

  return (
    <DeleteConfirmationModal
      title="Delete this comment?"
      description="This will permanently delete this comment. This action cannot be undone."
      onConfirm={handleDelete}
      isLoading={isPending}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      }
    />
  );
}

