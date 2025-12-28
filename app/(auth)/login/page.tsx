import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';

export const metadata = {
  title: 'Login | InstaClone',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="bg-black border border-zinc-800 rounded-sm px-10 py-10">
        {/* Logo */}
        <h1 className="text-4xl font-instagram text-white text-center mb-10">
          InstaClone
        </h1>

        {/* Login Form */}
        <LoginForm />

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-sm font-semibold text-zinc-500">OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Forgot Password */}
        <div className="text-center">
          <Link 
            href="/forgot-password" 
            className="text-sm text-white hover:text-zinc-300 transition-colors"
          >
            Forgotten your password?
          </Link>
        </div>
      </div>

      {/* Sign Up Card */}
      <div className="bg-black border border-zinc-800 rounded-sm px-10 py-5">
        <p className="text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link 
            href="/register" 
            className="text-[#0095F6] font-semibold hover:text-[#1877F2] transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Get the app */}
      <div className="text-center py-4">
        <p className="text-sm text-zinc-400 mb-4">Get the app.</p>
        <div className="flex justify-center gap-2">
          <div className="bg-zinc-900 rounded-lg px-4 py-2 text-xs text-white border border-zinc-800">
            App Store
          </div>
          <div className="bg-zinc-900 rounded-lg px-4 py-2 text-xs text-white border border-zinc-800">
            Google Play
          </div>
        </div>
      </div>
    </div>
  );
}
