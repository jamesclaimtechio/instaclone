'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { createComment } from '@/app/actions/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PostComment } from '@/lib/comments.types';

// ============================================================================
// TYPES
// ============================================================================

interface CommentInputProps {
  postId: string;
  /** Callback when a comment is successfully added */
  onCommentAdded?: (comment: PostComment) => void;
  /** Auto-focus the textarea on mount */
  autoFocus?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Comment input form with textarea and submit button
 * Handles validation, submission, and error feedback
 */
export default function CommentInput({
  postId,
  onCommentAdded,
  autoFocus = false,
}: CommentInputProps) {
  // State for textarea value
  const [text, setText] = useState('');
  
  // useTransition for pending state during submission
  const [isPending, startTransition] = useTransition();
  
  // Ref for textarea to manage focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Check if text is valid (not empty after trimming)
  const isValidText = text.trim().length > 0;

  // Handle form submission
  const handleSubmit = () => {
    // Prevent submission if already pending or text is empty
    if (isPending || !isValidText) return;

    const trimmedText = text.trim();

    startTransition(async () => {
      try {
        const result = await createComment(postId, trimmedText);

        if (result.success && result.comment) {
          // Success - clear the textarea
          setText('');
          
          // Notify parent component
          if (onCommentAdded) {
            onCommentAdded(result.comment);
          }

          // Focus textarea for follow-up comments
          textareaRef.current?.focus();
        } else {
          // Server returned error
          const errorMessage = getErrorMessage(result.error);
          toast.error(errorMessage);
          // Keep text for retry - don't clear
        }
      } catch (error) {
        // Network or unexpected error
        console.error('[CommentInput] Error:', error);
        toast.error('Couldn\'t post comment. Please try again.');
        // Keep text for retry - don't clear
      }
    });
  };

  // Handle keyboard submission (Cmd/Ctrl + Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment..."
        disabled={isPending}
        className="min-h-[80px] resize-none"
        aria-label="Comment text"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !isValidText}
          size="sm"
        >
          {isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map server error messages to user-friendly messages
 */
function getErrorMessage(error?: string): string {
  switch (error) {
    case 'Not authenticated':
      return 'Please log in to comment';
    case 'Post not found':
      return 'This post has been deleted';
    case 'Comment cannot be empty':
      return 'Comment cannot be empty';
    default:
      return 'Couldn\'t post comment. Please try again.';
  }
}

