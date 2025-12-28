'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from './delete-confirmation-modal';
import { adminDeleteUser, fetchUserCascadeStats } from '@/app/actions/admin';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface DeleteUserButtonProps {
  userId: string;
  username: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DeleteUserButton({ userId, username }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ postCount: number; commentCount: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch cascade stats when button is clicked (before modal opens)
  const handleTriggerClick = async () => {
    if (stats) return; // Already loaded
    
    setIsLoadingStats(true);
    try {
      const cascadeStats = await fetchUserCascadeStats(userId);
      setStats({ postCount: cascadeStats.postCount, commentCount: cascadeStats.commentCount });
    } catch (error) {
      console.error('Failed to load user stats:', error);
      // Proceed with zero counts
      setStats({ postCount: 0, commentCount: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await adminDeleteUser(userId);
      
      if (result.success) {
        toast.success(`User @${username} deleted successfully`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete user');
        throw new Error(result.error); // Keep modal open
      }
    });
  };

  const description = stats
    ? `This will permanently delete @${username} and all their content: ${stats.postCount} post${stats.postCount !== 1 ? 's' : ''}, ${stats.commentCount} comment${stats.commentCount !== 1 ? 's' : ''}, and all likes/follows. This action cannot be undone.`
    : `This will permanently delete @${username} and all their content. This action cannot be undone.`;

  return (
    <DeleteConfirmationModal
      title={`Delete user @${username}?`}
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

