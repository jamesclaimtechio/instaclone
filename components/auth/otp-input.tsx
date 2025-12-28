'use client';

import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOTP } from '@/app/actions/otp';
import { resendOTP } from '@/app/actions/otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OTPInput() {
  const router = useRouter();
  
  // OTP digit state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // UI state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  
  // Resend state
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (digits.every(d => d !== '') && !isVerifying && !isSuccess) {
      handleSubmit();
    }
  }, [digits, isVerifying, isSuccess]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(c => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    // Update digit
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Clear error when user starts typing
    if (error) {
      setError('');
      setAttemptsRemaining(null);
    }

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current or move to previous
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Arrow keys navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Extract only digits
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digitsOnly.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6 && i < digitsOnly.length; i++) {
        newDigits[i] = digitsOnly[i] || '';
      }
      setDigits(newDigits);
      
      // Focus last filled input or first empty
      const nextEmptyIndex = newDigits.findIndex(d => d === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyOTP(code);

      if (result.success) {
        setIsSuccess(true);
        toast.success('Email verified successfully!');
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/');
          router.refresh(); // Refresh to update verification status
        }, 2000);
      } else {
        const errorMessage = result.error || 'Verification failed';
        setError(errorMessage);
        setAttemptsRemaining(result.attemptsRemaining !== undefined ? result.attemptsRemaining : null);
        
        // Clear inputs for retry
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      const result = await resendOTP();

      if (result.success) {
        toast.success('New code sent! Check your email.');
        setResendCooldown(60); // Start 60-second cooldown
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        if (result.cooldownRemaining) {
          setResendCooldown(result.cooldownRemaining);
          toast.error(`Please wait ${result.cooldownRemaining} seconds before requesting another code`);
        } else {
          toast.error(result.error || 'Failed to send code');
        }
      }
    } catch (error) {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">Email Verified!</h3>
          <p className="text-sm text-gray-600 mt-2">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OTP Input Grid */}
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={isVerifying}
            className="w-12 h-14 text-center text-2xl font-bold"
            aria-label={`Digit ${index + 1}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm justify-center" role="alert">
          <AlertCircle className="h-4 w-4" />
          <p>
            {error}
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <span className="ml-1">({attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining)</span>
            )}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isVerifying || digits.some(d => d === '')}
        className="w-full"
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </Button>

      {/* Resend Button */}
      <div className="text-center text-sm">
        <p className="text-gray-600 mb-2">Didn't receive the code?</p>
        <Button
          variant="link"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="text-primary"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            'Resend Code'
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-center text-gray-500">
        The code expires in 15 minutes. Check your spam folder if you don't see it.
      </p>
    </div>
  );
}

