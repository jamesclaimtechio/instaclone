'use server';

/**
 * Password Reset Server Actions
 * 
 * Handle password reset request, token validation, and password update.
 * Designed to prevent email enumeration and ensure security.
 */

import { 
  generateResetToken, 
  storeResetToken, 
  validateResetToken as validateToken,
  consumeResetToken,
  findUserByEmail 
} from '@/lib/password-reset';
import { sendPasswordResetEmail } from '@/lib/email';
import { hashPassword } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

interface RequestResetResult {
  success: boolean;
  message: string;
}

interface ValidateTokenResult {
  valid: boolean;
  error?: string;
}

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get the base URL for reset links
function getBaseUrl(): string {
  // In production, use the NEXT_PUBLIC_APP_URL or VERCEL_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default for local development
  return 'http://localhost:3000';
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Request a password reset email
 * 
 * SECURITY: Always returns the same success message regardless of whether
 * the email exists to prevent email enumeration attacks.
 * 
 * @param email - The email address to send reset link to
 */
export async function requestPasswordReset(email: string): Promise<RequestResetResult> {
  try {
    // Validate email format
    if (!email || typeof email !== 'string') {
      return { 
        success: false, 
        message: 'Please enter a valid email address.' 
      };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { 
        success: false, 
        message: 'Please enter a valid email address.' 
      };
    }

    // Generic success message (shown regardless of email existence)
    const genericSuccess: RequestResetResult = {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    };

    // Look up user by email
    const user = await findUserByEmail(trimmedEmail);
    
    // If user doesn't exist, return success anyway (prevents enumeration)
    if (!user) {
      console.log('[PasswordReset] Reset requested for non-existent email:', trimmedEmail);
      return genericSuccess;
    }

    // Generate secure reset token
    const token = generateResetToken();

    // Store token in database
    const stored = await storeResetToken(user.id, token);
    if (!stored) {
      console.error('[PasswordReset] Failed to store reset token for user:', user.id);
      return genericSuccess; // Still return success to prevent enumeration
    }

    // Build reset link
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send reset email
    const emailSent = await sendPasswordResetEmail(trimmedEmail, user.username, resetLink);
    
    if (emailSent) {
      console.log('[PasswordReset] Reset email sent to:', trimmedEmail);
    } else {
      console.error('[PasswordReset] Failed to send reset email to:', trimmedEmail);
      // Still return success - we don't want to reveal email issues
    }

    return genericSuccess;
  } catch (error) {
    console.error('[PasswordReset] Error in requestPasswordReset:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
    };
  }
}

/**
 * Validate a password reset token
 * Used when user lands on reset password page to verify token is valid
 * 
 * @param token - The reset token from the URL
 */
export async function validateResetToken(token: string): Promise<ValidateTokenResult> {
  try {
    // Basic validation
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid reset link.' };
    }

    // Validate token
    const result = await validateToken(token);
    
    return {
      valid: result.valid,
      error: result.error,
    };
  } catch (error) {
    console.error('[PasswordReset] Error in validateResetToken:', error);
    return { valid: false, error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Reset user's password using a valid token
 * 
 * @param token - The reset token from the URL
 * @param newPassword - The new password to set
 */
export async function resetPassword(
  token: string, 
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    // Validate inputs
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Invalid reset link.' };
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return { success: false, error: 'Password is required.' };
    }

    // Password must have at least 1 character (per spec, no other requirements)
    if (newPassword.length === 0) {
      return { success: false, error: 'Password cannot be empty.' };
    }

    // Validate token and get userId
    const validation = await validateToken(token);
    if (!validation.valid || !validation.userId) {
      return { 
        success: false, 
        error: validation.error || 'Invalid or expired reset link. Please request a new one.' 
      };
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update user's password
    const updateResult = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, validation.userId))
      .returning({ id: users.id });

    if (updateResult.length === 0) {
      return { success: false, error: 'Failed to update password. User not found.' };
    }

    // Consume (delete) the token to prevent reuse
    await consumeResetToken(token);

    console.log('[PasswordReset] Password reset successful for user:', validation.userId);

    return { success: true };
  } catch (error) {
    console.error('[PasswordReset] Error in resetPassword:', error);
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
}

