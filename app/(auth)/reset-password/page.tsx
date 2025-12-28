import { Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/reset-password-form';
import Link from 'next/link';

export const metadata = {
  title: 'Reset Password | InstaClone',
  description: 'Create a new password',
};

// Loading skeleton for the form
function ResetPasswordSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-12 w-full bg-zinc-800 rounded-sm animate-pulse" />
      <div className="h-10 w-full bg-zinc-800 rounded-lg animate-pulse" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="bg-black border border-zinc-800 rounded-sm px-10 py-10">
        {/* Key Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full border-2 border-zinc-700 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-12 h-12 text-white"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-white text-center mb-2">
          Create a new password
        </h1>

        {/* Description */}
        <p className="text-sm text-zinc-400 text-center mb-6">
          Your new password must be different from previously used passwords.
        </p>

        {/* Reset Password Form - wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<ResetPasswordSkeleton />}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      {/* Back to Login Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
        <Link 
          href="/login"
          className="block py-4 text-center text-sm text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}

