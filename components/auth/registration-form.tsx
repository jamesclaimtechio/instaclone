'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      // For MVP, we skip the real-time uniqueness check API call
      // Uniqueness will be checked on form submission
      // This just validates the format
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
    
    // Clear previous errors
    setErrors(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);

      const result = await registerUser(formData);

      if (result.success) {
        // Success - Server Action will redirect
        // This code won't execute due to redirect
        router.push(result.redirect);
      } else {
        // Show error
        setErrors(result.error);
      }
    } catch (error: any) {
      // NEXT_REDIRECT is thrown by redirect() in Server Actions - let it propagate
      if (error?.message?.includes('NEXT_REDIRECT') || error?.digest?.includes('NEXT_REDIRECT')) {
        throw error; // Let Next.js handle the redirect
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General Error */}
      {errors?.field === 'general' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-900" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{errors.message}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          aria-required="true"
          aria-invalid={errors?.field === 'email'}
          aria-describedby={errors?.field === 'email' ? 'email-error' : undefined}
          className={errors?.field === 'email' ? 'border-red-500' : ''}
        />
        {errors?.field === 'email' && (
          <p id="email-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" />
            {errors.message}
          </p>
        )}
      </div>

      {/* Username Field */}
      <div className="space-y-2">
        <Label htmlFor="username">
          Username <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="john_doe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            aria-required="true"
            aria-invalid={errors?.field === 'username' || usernameValidation === 'invalid'}
            aria-describedby={errors?.field === 'username' ? 'username-error' : usernameError ? 'username-validation' : undefined}
            className={errors?.field === 'username' || usernameValidation === 'invalid' ? 'border-red-500' : usernameValidation === 'valid' ? 'border-green-500' : ''}
          />
          {/* Validation Icon */}
          {usernameValidation === 'checking' && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
          {usernameValidation === 'valid' && !errors && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
          )}
        </div>
        {usernameValidation === 'invalid' && usernameError && (
          <p id="username-validation" className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" />
            {usernameError}
          </p>
        )}
        {errors?.field === 'username' && (
          <p id="username-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" />
            {errors.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            aria-required="true"
            aria-invalid={errors?.field === 'password'}
            aria-describedby={errors?.field === 'password' ? 'password-error' : undefined}
            className={errors?.field === 'password' ? 'border-red-500 pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors?.field === 'password' && (
          <p id="password-error" className="text-sm text-red-600 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" />
            {errors.message}
          </p>
        )}
        <p className="text-xs text-gray-500">No restrictions - any password is accepted</p>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || usernameValidation === 'checking'}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      {/* Navigation Link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Login
        </Link>
      </p>
    </form>
  );
}

