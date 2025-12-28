import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import CreatePostForm from '@/components/posts/create-post-form';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Create Post',
  description: 'Share a new photo',
};

// ============================================================================
// PAGE
// ============================================================================

/**
 * Create Post Page
 * Requires authentication - redirects to login if not authenticated
 */
export default async function CreatePostPage() {
  // Check authentication
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
          <p className="text-gray-600 mt-1">Share a photo with your followers</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <CreatePostForm />
        </div>
      </div>
    </div>
  );
}

