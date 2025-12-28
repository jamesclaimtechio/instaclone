import ForgotPasswordForm from '@/components/auth/forgot-password-form';
import Link from 'next/link';

export const metadata = {
  title: 'Forgot Password | InstaClone',
  description: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="bg-black border border-zinc-800 rounded-sm px-10 py-10">
        {/* Lock Icon */}
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-white text-center mb-2">
          Trouble logging in?
        </h1>

        {/* Description */}
        <p className="text-sm text-zinc-400 text-center mb-6">
          Enter your email address and we&apos;ll send you a link to get back into your account.
        </p>

        {/* Forgot Password Form */}
        <ForgotPasswordForm />

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-sm font-semibold text-zinc-500">OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Create Account */}
        <div className="text-center">
          <Link 
            href="/register" 
            className="text-sm text-white font-semibold hover:text-zinc-300 transition-colors"
          >
            Create new account
          </Link>
        </div>
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

