import Link from 'next/link';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Custom 404 page for profile routes
 * Shown when a username doesn't exist
 */
export default function ProfileNotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <UserX className="w-10 h-10 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">
          Sorry, this page isn&apos;t available.
        </h1>
        
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          The link you followed may be broken, or the page may have been removed.
        </p>
        
        <Link href="/">
          <Button>Go back to Home</Button>
        </Link>
      </div>
    </main>
  );
}

