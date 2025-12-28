'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from './delete-confirmation-modal';
import { adminDeletePost, fetchPostCascadeStats } from '@/app/actions/admin';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface DeletePostButtonProps {
  postId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ likeCount: number; commentCount: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch cascade stats when button is clicked (before modal opens)
  const handleTriggerClick = async () => {
    if (stats) return; // Already loaded
    
    setIsLoadingStats(true);
    try {
      const cascadeStats = await fetchPostCascadeStats(postId);
      setStats({ likeCount: cascadeStats.likeCount, commentCount: cascadeStats.commentCount });
    } catch (error) {
      console.error('Failed to load post stats:', error);
      setStats({ likeCount: 0, commentCount: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await adminDeletePost(postId);
      
      if (result.success) {
        toast.success('Post deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete post');
        throw new Error(result.error); // Keep modal open
      }
    });
  };

  const description = stats
    ? `This will permanently delete this post and all associated data: ${stats.likeCount} like${stats.likeCount !== 1 ? 's' : ''}, ${stats.commentCount} comment${stats.commentCount !== 1 ? 's' : ''}. This action cannot be undone.`
    : `This will permanently delete this post and all associated likes and comments. This action cannot be undone.`;

  return (
    <DeleteConfirmationModal
      title="Delete this post?"
      description={description}
      onConfirm={handleDelete}
      isLoading={isPending}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleTriggerClick}
          disabled={isLoadingStats}
        >
          {isLoadingStats ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      }
    />
  );
}

