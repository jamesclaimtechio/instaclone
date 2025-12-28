/**
 * Password Reset Token Utilities
 * 
 * Secure token generation, storage, and validation for password reset flow.
 * Reuses the otp_codes table with type='password_reset'.
 */

import crypto from 'crypto';
import { db, otpCodes, users } from '@/db';
import { eq, and, gt, sql } from 'drizzle-orm';

// ============================================================================
// CONSTANTS
// ============================================================================

// Reset token expires in 1 hour
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Token type identifier in otp_codes table
const TOKEN_TYPE = 'password_reset';

// ============================================================================
// TYPES
// ============================================================================

export interface ResetTokenValidation {
  valid: boolean;
  userId?: string;
  error?: string;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure reset token
 * Uses crypto.randomBytes for unpredictability
 * 
 * @returns 64-character hex string
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================================
// TOKEN STORAGE
// ============================================================================

/**
 * Store a password reset token for a user
 * Invalidates any existing reset tokens for this user first
 * 
 * @param userId - The user's ID
 * @param token - The reset token to store
 * @returns true if stored successfully
 */
export async function storeResetToken(userId: string, token: string): Promise<boolean> {
  try {
    // Delete any existing reset tokens for this user
    await db.delete(otpCodes).where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.type, TOKEN_TYPE)
      )
    );

    // Calculate expiry time (1 hour from now)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    // Insert new reset token
    await db.insert(otpCodes).values({
      userId,
      code: token,
      type: TOKEN_TYPE,
      expiresAt,
    });

    return true;
  } catch (error) {
    console.error('[storeResetToken] Error:', error);
    return false;
  }
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validate a password reset token
 * Checks existence, expiry, and returns associated userId if valid
 * 
 * @param token - The reset token to validate
 * @returns Validation result with userId if valid
 */
export async function validateResetToken(token: string): Promise<ResetTokenValidation> {
  try {
    // Basic validation
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return { valid: false, error: 'Invalid reset link' };
    }

    // Query for the token
    const result = await db
      .select({
        id: otpCodes.id,
        userId: otpCodes.userId,
        expiresAt: otpCodes.expiresAt,
      })
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.code, token),
          eq(otpCodes.type, TOKEN_TYPE)
        )
      )
      .limit(1);

    // Token not found
    const tokenRecord = result[0];
    if (!tokenRecord) {
      return { valid: false, error: 'Invalid reset link' };
    }

    // Check if expired
    if (tokenRecord.expiresAt < new Date()) {
      // Clean up expired token
      await db.delete(otpCodes).where(eq(otpCodes.id, tokenRecord.id));
      return { valid: false, error: 'Reset link has expired. Please request a new one.' };
    }

    return { valid: true, userId: tokenRecord.userId };
  } catch (error) {
    console.error('[validateResetToken] Error:', error);
    return { valid: false, error: 'Something went wrong. Please try again.' };
  }
}

// ============================================================================
// TOKEN CONSUMPTION
// ============================================================================

/**
 * Delete a reset token after successful password reset
 * Ensures one-time use
 * 
 * @param token - The token to consume/delete
 * @returns true if deleted successfully
 */
export async function consumeResetToken(token: string): Promise<boolean> {
  try {
    await db.delete(otpCodes).where(
      and(
        eq(otpCodes.code, token),
        eq(otpCodes.type, TOKEN_TYPE)
      )
    );
    return true;
  } catch (error) {
    console.error('[consumeResetToken] Error:', error);
    return false;
  }
}

// ============================================================================
// USER LOOKUP
// ============================================================================

/**
 * Find a user by email (case-insensitive)
 * Used for password reset requests
 * 
 * @param email - The email to look up
 * @returns User id and username if found, null otherwise
 */
export async function findUserByEmail(email: string): Promise<{ id: string; username: string } | null> {
  try {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('[findUserByEmail] Error:', error);
    return null;
  }
}

