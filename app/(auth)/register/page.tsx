import RegistrationForm from '@/components/auth/registration-form';
import Link from 'next/link';

export const metadata = {
  title: 'Sign up | InstaClone',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="bg-black border border-zinc-800 rounded-sm px-10 py-10">
        {/* Logo */}
        <h1 className="text-4xl font-instagram text-white text-center mb-4">
          InstaClone
        </h1>

        {/* Tagline */}
        <p className="text-zinc-400 text-center text-base font-semibold mb-6">
          Sign up to see photos and videos from your friends.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-sm font-semibold text-zinc-500">OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Registration Form */}
        <RegistrationForm />

        {/* Terms */}
        <p className="text-xs text-zinc-500 text-center mt-6 leading-relaxed">
          By signing up, you agree to our{' '}
          <span className="text-zinc-400">Terms</span>,{' '}
          <span className="text-zinc-400">Privacy Policy</span> and{' '}
          <span className="text-zinc-400">Cookies Policy</span>.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-black border border-zinc-800 rounded-sm px-10 py-5">
        <p className="text-center text-sm text-zinc-400">
          Have an account?{' '}
          <Link 
            href="/login" 
            className="text-[#0095F6] font-semibold hover:text-[#1877F2] transition-colors"
          >
            Log in
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
