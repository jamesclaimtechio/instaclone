'use server';

import { getCurrentUser } from '@/lib/auth';
import { db, users, otpCodes } from '@/db';
import { eq, and } from 'drizzle-orm';
import { 
  sendOTPToUser, 
  checkOTPCooldown, 
  canAttemptVerification,
  recordFailedAttempt,
  resetVerificationAttempts,
  ResendOTPResult,
  VerifyOTPResult 
} from '@/lib/otp';

/**
 * Resends OTP verification email to currently authenticated user
 * Includes rate limiting (60 seconds between sends)
 * @returns Result with success status, error message, or cooldown remaining
 */
export async function resendOTP(): Promise<ResendOTPResult> {
  try {
    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to resend verification code',
      };
    }

    // Get full user record to check verification status
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email is already verified',
      };
    }

    // Check rate limiting (60 seconds between sends)
    const cooldownRemaining = await checkOTPCooldown(user.id);
    
    if (cooldownRemaining > 0) {
      return {
        success: false,
        error: `Please wait ${cooldownRemaining} seconds before requesting another code`,
        cooldownRemaining,
      };
    }

    // Generate and send new OTP
    const sent = await sendOTPToUser(user.id, user.email, user.username);

    if (!sent) {
      return {
        success: false,
        error: 'Failed to send verification code. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('[OTP] Resend error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

/**
 * Verifies OTP code entered by user
 * Includes rate limiting (5 attempts per 15 minutes) and expiration checking
 * @param code - 6-digit OTP code entered by user
 * @returns Result with success status, error message, or attempts remaining
 */
export async function verifyOTP(code: string): Promise<VerifyOTPResult> {
  try {
    // Sanitize input - remove whitespace and dashes
    const sanitizedCode = code.trim().replace(/[\s-]/g, '');
    
    // Validate format
    if (!/^\d{6}$/.test(sanitizedCode)) {
      return {
        success: false,
        error: 'Invalid code format. Please enter a 6-digit code.',
      };
    }

    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be logged in to verify your email',
      };
    }

    // Get full user record
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email is already verified',
      };
    }

    // Check rate limiting (5 attempts per 15 minutes)
    const { allowed, remaining } = canAttemptVerification(user.id);
    
    if (!allowed) {
      return {
        success: false,
        error: 'Too many attempts. Please try again in 15 minutes.',
        attemptsRemaining: 0,
      };
    }

    // Look up OTP record
    const otp = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.code, sanitizedCode)
      ),
    });

    // If OTP not found, record failed attempt
    if (!otp) {
      const attemptsRemaining = recordFailedAttempt(user.id);
      
      return {
        success: false,
        error: attemptsRemaining > 0 
          ? `Invalid code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
          : 'Too many attempts. Please try again in 15 minutes.',
        attemptsRemaining,
      };
    }

    // Check if OTP has expired
    if (Date.now() > otp.expiresAt.getTime()) {
      // Delete expired OTP
      await db.delete(otpCodes).where(eq(otpCodes.id, otp.id));
      
      return {
        success: false,
        error: 'Code has expired. Please request a new code.',
      };
    }

    // OTP is valid! Update user and delete OTP in transaction
    await db.transaction(async (tx) => {
      // Set emailVerified to true
      await tx
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
      
      // Delete used OTP
      await tx.delete(otpCodes).where(eq(otpCodes.id, otp.id));
    });

    // Reset verification attempts on success
    resetVerificationAttempts(user.id);

    console.log('[OTP] Email verified successfully for user:', user.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error('[OTP] Verification error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

