import { MessageCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CommentsSectionProps {
  postId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Comments section placeholder
 * Will be implemented in Module 8 with full comment functionality
 */
export default function CommentsSection({ postId }: CommentsSectionProps) {
  return (
    <div className="py-8 text-center">
      <div className="inline-flex p-3 rounded-full bg-gray-100 mb-3">
        <MessageCircle className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">
        No comments yet.
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Be the first to comment!
      </p>
    </div>
  );
}

