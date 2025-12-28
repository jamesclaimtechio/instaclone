import crypto from 'crypto';
import { db, otpCodes } from '@/db';
import { eq } from 'drizzle-orm';
import { sendOTPEmail } from './email';

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_EXPIRATION_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;

// ============================================================================
// TYPES
// ============================================================================

export interface OTPRecord {
  id: string;
  userId: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OTPResult {
  success: boolean;
  error?: string;
}

export interface ResendOTPResult {
  success: boolean;
  error?: string;
  cooldownRemaining?: number;
}

// ============================================================================
// OTP GENERATION
// ============================================================================

/**
 * Generates a cryptographically secure 6-digit OTP code
 * Uses crypto.randomInt for unpredictable codes
 * @returns 6-digit string with leading zeros (e.g., "001234")
 */
export function generateOTP(): string {
  // Generate random number between 0 and 999999
  const code = crypto.randomInt(0, 1000000);
  
  // Pad with leading zeros to ensure 6 digits
  return code.toString().padStart(6, '0');
}

/**
 * Calculates OTP expiration timestamp (15 minutes from now)
 * @returns Date object representing expiration time
 */
export function getOTPExpiration(): Date {
  return new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
}

// ============================================================================
// OTP STORAGE
// ============================================================================

/**
 * Invalidates all existing OTPs for a user
 * Should be called before generating a new OTP
 * @param userId - User's UUID
 */
export async function invalidateUserOTPs(userId: string): Promise<void> {
  try {
    await db.delete(otpCodes).where(eq(otpCodes.userId, userId));
  } catch (error) {
    console.error('[OTP] Failed to invalidate old OTPs:', error);
    // Don't throw - continue with new OTP generation
  }
}

/**
 * Stores a new OTP in the database
 * Automatically invalidates any existing OTPs for the user first
 * @param userId - User's UUID
 * @param code - 6-digit OTP code
 * @returns Promise resolving to true if stored successfully
 */
export async function storeOTP(userId: string, code: string): Promise<boolean> {
  try {
    // Use transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete any existing OTPs for this user
      await tx.delete(otpCodes).where(eq(otpCodes.userId, userId));
      
      // Insert new OTP
      await tx.insert(otpCodes).values({
        userId,
        code,
        expiresAt: getOTPExpiration(),
      });
    });

    return true;
  } catch (error) {
    console.error('[OTP] Failed to store OTP:', error);
    return false;
  }
}

/**
 * Checks if enough time has passed since last OTP send (rate limiting)
 * @param userId - User's UUID
 * @returns Promise resolving to remaining cooldown seconds (0 if can send)
 */
export async function checkOTPCooldown(userId: string): Promise<number> {
  try {
    // Find most recent OTP for this user
    const recentOTP = await db.query.otpCodes.findFirst({
      where: eq(otpCodes.userId, userId),
      orderBy: (otpCodes, { desc }) => [desc(otpCodes.createdAt)],
    });

    if (!recentOTP) {
      return 0; // No recent OTP, can send immediately
    }

    // Calculate time since last OTP
    const timeSinceLastOTP = Date.now() - recentOTP.createdAt.getTime();
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;

    if (timeSinceLastOTP < cooldownMs) {
      // Still in cooldown period
      return Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
    }

    return 0; // Cooldown expired, can send
  } catch (error) {
    console.error('[OTP] Failed to check cooldown:', error);
    return 0; // On error, allow send (fail open)
  }
}

// ============================================================================
// HIGH-LEVEL OTP FUNCTIONS
// ============================================================================

/**
 * Generates, stores, and emails an OTP to a user
 * Complete flow for sending verification code
 * @param userId - User's UUID
 * @param email - User's email address
 * @param username - User's username for email personalization
 * @returns Promise resolving to true if OTP sent successfully
 */
export async function sendOTPToUser(
  userId: string,
  email: string,
  username: string
): Promise<boolean> {
  try {
    // Generate new OTP code
    const code = generateOTP();
    
    // Store in database (invalidates old codes automatically)
    const stored = await storeOTP(userId, code);
    
    if (!stored) {
      console.error('[OTP] Failed to store OTP for user:', userId);
      return false;
    }

    // Send OTP via email (async, don't block on failure)
    const emailSent = await sendOTPEmail(email, username, code);
    
    if (!emailSent) {
      console.error('[OTP] Failed to send OTP email to:', email);
      // OTP is stored, so return true - user can request resend
      // This prevents email service failures from blocking registration
    }

    console.log('[OTP] OTP generated and sent for user:', userId);
    return true;
  } catch (error) {
    console.error('[OTP] Error in sendOTPToUser:', error);
    return false;
  }
}

