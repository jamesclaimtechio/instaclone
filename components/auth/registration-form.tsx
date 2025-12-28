'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

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
  autoCapitalize?: string;
  inputMode?: 'email' | 'text' | 'tel' | 'url' | 'search' | 'none' | 'numeric' | 'decimal';
  className?: string;
  rightElement?: React.ReactNode;
  hasError?: boolean;
  isValid?: boolean;
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
  autoCapitalize,
  inputMode,
  className = '',
  rightElement,
  hasError = false,
  isValid = false,
}: InstagramInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  // Determine border color
  let borderClass = 'border-zinc-700 focus:border-zinc-500';
  if (hasError) {
    borderClass = 'border-red-500';
  } else if (isValid && hasValue) {
    borderClass = 'border-zinc-700';
  }

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
        autoCapitalize={autoCapitalize}
        inputMode={inputMode}
        className={`
          w-full bg-zinc-900 border rounded-sm
          px-3 pt-4 pb-1 text-sm text-white
          placeholder-transparent
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${borderClass}
          ${rightElement ? 'pr-16' : ''}
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
      {/* Right side elements */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {/* Validation icon */}
        {hasValue && !hasError && isValid && (
          <Check className="h-5 w-5 text-zinc-500" />
        )}
        {hasValue && hasError && (
          <X className="h-5 w-5 text-red-500" />
        )}
        {rightElement}
      </div>
    </div>
  );
}

// ============================================================================
// REGISTRATION FORM
// ============================================================================

export default function RegistrationForm() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation state
  const [usernameValidation, setUsernameValidation] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');
  
  // Error state
  const [errors, setErrors] = useState<{
    field: 'email' | 'username' | 'password' | 'general';
    message: string;
  } | null>(null);

  // Real-time username validation with debounce
  useEffect(() => {
    if (!username) {
      setUsernameValidation('idle');
      setUsernameError('');
      return;
    }

    // Check format first (local validation)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameValidation('invalid');
      setUsernameError('Only letters, numbers, underscores, and hyphens allowed');
      return;
    }

    // Debounce server-side uniqueness check
    setUsernameValidation('checking');
    const timer = setTimeout(async () => {
      setUsernameValidation('valid');
      setUsernameError('');
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Clear errors when user modifies the field that had an error
  useEffect(() => {
    if (errors?.field === 'email' && email) {
      setErrors(null);
    }
  }, [email, errors]);

  useEffect(() => {
    if (errors?.field === 'username' && username) {
      setErrors(null);
    }
  }, [username, errors]);

  useEffect(() => {
    if (errors?.field === 'password' && password) {
      setErrors(null);
    }
  }, [password, errors]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    setErrors(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);

      const result = await registerUser(formData);

      if (result.success) {
        router.push(result.redirect);
      } else {
        setErrors(result.error);
      }
    } catch (error: unknown) {
      // NEXT_REDIRECT is thrown by redirect() in Server Actions - let it propagate
      if (error instanceof Error && (error.message?.includes('NEXT_REDIRECT') || (error as Error & { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
        throw error;
      }
      
      console.error('Registration error:', error);
      setErrors({
        field: 'general',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Check if form is valid
  const isFormValid = 
    email.length > 0 && 
    username.length > 0 && 
    password.length > 0 && 
    usernameValidation !== 'invalid' &&
    usernameValidation !== 'checking';

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* General Error */}
      {errors?.field === 'general' && (
        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm text-center">
          {errors.message}
        </div>
      )}

      {/* Email Field */}
      <InstagramInput
        id="email"
        name="email"
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
        autoComplete="email"
        inputMode="email"
        hasError={errors?.field === 'email'}
        isValid={email.length > 0 && !errors}
      />
      {errors?.field === 'email' && (
        <p className="text-xs text-red-400 px-1">{errors.message}</p>
      )}

      {/* Username Field */}
      <InstagramInput
        id="username"
        name="username"
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        required
        autoComplete="username"
        autoCapitalize="none"
        hasError={errors?.field === 'username' || usernameValidation === 'invalid'}
        isValid={usernameValidation === 'valid'}
        rightElement={
          usernameValidation === 'checking' && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          )
        }
      />
      {(errors?.field === 'username' || usernameValidation === 'invalid') && (
        <p className="text-xs text-red-400 px-1">
          {errors?.field === 'username' ? errors.message : usernameError}
        </p>
      )}

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
        autoComplete="new-password"
        hasError={errors?.field === 'password'}
        isValid={password.length > 0 && !errors}
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
      {errors?.field === 'password' && (
        <p className="text-xs text-red-400 px-1">{errors.message}</p>
      )}

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
            Creating account...
          </span>
        ) : (
          'Sign up'
        )}
      </button>
    </form>
  );
}
