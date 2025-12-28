'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser } from '@/app/actions/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// ============================================================================
// INSTAGRAM-STYLE INPUT COMPONENT
// ============================================================================

interface InstagramInputProps {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'email' | 'text' | 'tel' | 'url' | 'search' | 'none' | 'numeric' | 'decimal';
  className?: string;
  rightElement?: React.ReactNode;
}

function InstagramInput({
  id,
  name,
  type,
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  autoComplete,
  inputMode,
  className = '',
  rightElement,
}: InstagramInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`
          w-full bg-zinc-900 border border-zinc-700 rounded-sm
          px-3 pt-4 pb-1 text-sm text-white
          placeholder-transparent
          focus:outline-none focus:border-zinc-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${rightElement ? 'pr-12' : ''}
        `}
        placeholder={placeholder}
      />
      <label
        htmlFor={id}
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none
          ${isFocused || hasValue
            ? 'top-1 text-[10px] text-zinc-400'
            : 'top-1/2 -translate-y-1/2 text-xs text-zinc-400'
          }
        `}
      >
        {placeholder}
      </label>
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LOGIN FORM INNER
// ============================================================================

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string>('');

  // Clear error when user types
  useEffect(() => {
    if (error && (email || password)) {
      setError('');
    }
  }, [email, password, error]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const result = await loginUser(formData);

      if (result.success) {
        if (returnUrl && returnUrl.startsWith('/')) {
          router.push(returnUrl);
        } else {
          router.push(result.redirect);
        }
      } else {
        setError(result.error.message);
      }
    } catch (error: unknown) {
      // NEXT_REDIRECT is thrown by redirect() in Server Actions - let it propagate
      if (error instanceof Error && (error.message?.includes('NEXT_REDIRECT') || (error as Error & { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
        throw error;
      }
      
      console.error('Login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Check if form is valid
  const isFormValid = email.length > 0 && password.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Error Message */}
      {error && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Email Field */}
      <InstagramInput
        id="email"
        name="email"
        type="email"
        placeholder="Phone number, username or email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
        autoComplete="email"
        inputMode="email"
      />

      {/* Password Field */}
      <InstagramInput
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
        autoComplete="current-password"
        rightElement={
          password.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm font-semibold text-white hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )
        }
      />

      {/* Submit Button */}
      <button 
        type="submit" 
        className={`
          w-full py-2 mt-4 rounded-lg font-semibold text-sm
          transition-all duration-200
          ${isFormValid && !isLoading
            ? 'bg-[#0095F6] hover:bg-[#1877F2] text-white cursor-pointer'
            : 'bg-[#0095F6]/40 text-white/50 cursor-not-allowed'
          }
        `}
        disabled={isLoading || !isFormValid}
        aria-live="polite"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Logging in...
          </span>
        ) : (
          'Log in'
        )}
      </button>
    </form>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function LoginFormSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-11 w-full bg-zinc-800 rounded-sm animate-pulse" />
      <div className="h-11 w-full bg-zinc-800 rounded-sm animate-pulse" />
      <div className="h-10 w-full bg-zinc-800 rounded-lg animate-pulse mt-4" />
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default function LoginForm() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginFormInner />
    </Suspense>
  );
}
