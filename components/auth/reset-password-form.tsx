'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateResetToken, resetPassword } from '@/app/actions/password-reset';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Validation state
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string>('');

  // Form state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Error state
  const [error, setError] = useState<string>('');

  // Validate token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        setTokenError('Invalid reset link. Please request a new one.');
        return;
      }

      try {
        const result = await validateResetToken(token);
        setIsTokenValid(result.valid);
        if (!result.valid) {
          setTokenError(result.error || 'Invalid reset link.');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setIsTokenValid(false);
        setTokenError('Something went wrong. Please try again.');
      } finally {
        setIsValidating(false);
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!token) return;
    
    // Clear previous errors
    setError('');
    setIsLoading(true);

    try {
      const result = await resetPassword(token, password);

      if (result.success) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Validating reset link...</p>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Link expired or invalid
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          {tokenError}
        </p>
        <Link
          href="/forgot-password"
          className="inline-block px-6 py-2 bg-[#0095F6] hover:bg-[#1877F2] text-white font-semibold text-sm rounded-lg transition-colors"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Password reset successful!
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          Your password has been updated. Redirecting to login...
        </p>
        <Link
          href="/login"
          className="text-sm text-[#0095F6] hover:text-[#1877F2] transition-colors"
        >
          Go to login now
        </Link>
      </div>
    );
  }

  // Check if form is valid
  const isFormValid = password.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Password Field */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <KeyRound className="w-5 h-5" />
        </div>
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          disabled={isLoading}
          required
          autoComplete="new-password"
          placeholder="New password"
          className="
            w-full bg-zinc-900 border border-zinc-700 rounded-sm
            pl-10 pr-12 py-3 text-sm text-white
            placeholder-zinc-500
            focus:outline-none focus:border-zinc-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        />
        {password.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
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
            Resetting...
          </span>
        ) : (
          'Reset password'
        )}
      </button>
    </form>
  );
}

