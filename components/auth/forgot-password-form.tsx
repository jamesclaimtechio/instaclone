'use client';

import { useState, FormEvent } from 'react';
import { requestPasswordReset } from '@/app/actions/password-reset';
import { Loader2, CheckCircle, Mail } from 'lucide-react';

export default function ForgotPasswordForm() {
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Error state
  const [error, setError] = useState<string>('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Success state - show confirmation
  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Check your email
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          If an account exists with <span className="text-white">{email}</span>, you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-xs text-zinc-500">
          Didn&apos;t receive an email? Check your spam folder or try again in a few minutes.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setEmail('');
          }}
          className="mt-4 text-sm text-[#0095F6] hover:text-[#1877F2] transition-colors"
        >
          Try a different email
        </button>
      </div>
    );
  }

  // Check if form is valid
  const isFormValid = email.length > 0 && email.includes('@');

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <Mail className="w-5 h-5" />
        </div>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          disabled={isLoading}
          required
          autoComplete="email"
          inputMode="email"
          placeholder="Email address"
          className="
            w-full bg-zinc-900 border border-zinc-700 rounded-sm
            pl-10 pr-4 py-3 text-sm text-white
            placeholder-zinc-500
            focus:outline-none focus:border-zinc-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        />
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className={`
          w-full py-2 rounded-lg font-semibold text-sm
          transition-all duration-200
          ${isFormValid && !isLoading
            ? 'bg-[#0095F6] hover:bg-[#1877F2] text-white cursor-pointer'
            : 'bg-[#0095F6]/40 text-white/50 cursor-not-allowed'
          }
        `}
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </span>
        ) : (
          'Send login link'
        )}
      </button>
    </form>
  );
}

