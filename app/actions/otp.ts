'use server';

import { getCurrentUser } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { sendOTPToUser, checkOTPCooldown, ResendOTPResult } from '@/lib/otp';

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

