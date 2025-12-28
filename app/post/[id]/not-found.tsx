import Link from 'next/link';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// NOT FOUND PAGE
// ============================================================================

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="inline-flex p-6 rounded-full bg-gray-100 mb-6">
          <Camera className="h-12 w-12 text-gray-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Post Not Found
        </h1>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          This post may have been deleted or the link might be broken.
        </p>

        {/* CTA */}
        <Button asChild>
          <Link href="/">
            Back to Feed
          </Link>
        </Button>
      </div>
    </div>
  );
}

