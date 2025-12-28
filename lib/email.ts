import { Resend } from 'resend';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

// NOTE: When using Resend test email (onboarding@resend.dev), you can only send
// to the email address associated with your Resend account.
// For production, verify a domain at resend.com/domains and use noreply@yourdomain.com

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error(
      'RESEND_API_KEY is not defined. Please add it to your environment variables.\n' +
      'Get your API key from: https://resend.com/api-keys'
    );
  }

  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }

  return resendClient;
}

// ============================================================================
// TYPES
// ============================================================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OTPEmailData {
  code: string;
  username: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailData {
  username: string;
  resetLink: string;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class EmailSendError extends Error {
  constructor(message = 'Failed to send email') {
    super(message);
    this.name = 'EmailSendError';
  }
}

export class EmailRateLimitError extends Error {
  constructor(message = 'Email rate limit exceeded') {
    super(message);
    this.name = 'EmailRateLimitError';
  }
}

export class EmailInvalidRecipientError extends Error {
  constructor(message = 'Invalid email recipient') {
    super(message);
    this.name = 'EmailInvalidRecipientError';
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Renders the OTP verification email HTML template
 */
export function renderOTPEmail(data: OTPEmailData): string {
  const { code, username, expiresInMinutes } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #262626; font-weight: 600;">
                Verify Your Email
              </h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <p style="margin: 0; font-size: 16px; color: #737373; line-height: 24px;">
                Hi ${username},
              </p>
              <p style="margin: 16px 0 0; font-size: 16px; color: #737373; line-height: 24px;">
                Use the code below to verify your email address and complete your registration.
              </p>
            </td>
          </tr>
          
          <!-- OTP Code -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <div style="background-color: #f9f9f9; border: 2px dashed #e5e5e5; border-radius: 8px; padding: 30px; display: inline-block;">
                <div style="font-size: 48px; font-weight: bold; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Expiration Notice -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                This code expires in <strong style="color: #737373;">${expiresInMinutes} minutes</strong>
              </p>
            </td>
          </tr>
          
          <!-- Instructions -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #737373; line-height: 20px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                This is an automated email from Instagram Clone. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

/**
 * Sends an email with retry logic and exponential backoff
 */
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const resend = getResendClient();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      // Check for error response
      if ('error' in result && result.error) {
        throw new Error(result.error.message || 'Email send failed');
      }

      // Log successful send
      const messageId = 'data' in result && result.data ? result.data.id : undefined;
      console.log('[Email] Successfully sent to:', to, '| Message ID:', messageId);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      const statusCode = error.statusCode || 0;

      // Log attempt
      console.error(`[Email] Send attempt ${attempt + 1}/${MAX_RETRIES} failed:`, {
        to,
        statusCode,
        error: error.message,
      });

      // Don't retry on 4xx errors (client errors - invalid request, auth failure, etc.)
      if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 429) {
          throw new EmailRateLimitError('Email rate limit exceeded. Please try again later.');
        }
        if (statusCode === 400 || statusCode === 422) {
          throw new EmailInvalidRecipientError(`Invalid recipient email: ${to}`);
        }
        throw new EmailSendError(error.message || 'Failed to send email');
      }

      // If this is the last attempt, throw error
      if (attempt === MAX_RETRIES - 1) {
        throw new EmailSendError(
          `Failed to send email after ${MAX_RETRIES} attempts: ${error.message}`
        );
      }

      // Wait before retrying (exponential backoff)
      await sleep(RETRY_DELAYS[attempt] || 1000);
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
  };
}

/**
 * Sends OTP verification email to user
 * @param email - Recipient email address
 * @param username - User's username for personalization
 * @param code - 6-digit OTP code
 * @returns Promise resolving to true if sent successfully, false otherwise
 */
export async function sendOTPEmail(
  email: string,
  username: string,
  code: string
): Promise<boolean> {
  try {
    // Render email template with OTP data
    const html = renderOTPEmail({
      code,
      username,
      expiresInMinutes: 15,
    });

    // Send email with retry logic
    const result = await sendEmailWithRetry(
      email,
      'Verify your email - Instagram Clone',
      html
    );

    return result.success;
  } catch (error) {
    if (error instanceof EmailRateLimitError) {
      console.error('[Email] Rate limit error:', error.message);
      // Don't throw - let registration continue, user can request resend later
      return false;
    }

    if (error instanceof EmailInvalidRecipientError) {
      console.error('[Email] Invalid recipient:', error.message);
      // Don't throw - email might be invalid but user registered
      return false;
    }

    console.error('[Email] Unexpected error sending OTP:', error);
    return false;
  }
}

/**
 * Sends a test email (for verification during development)
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  try {
    const html = renderOTPEmail({
      code: '123456',
      username: 'Test User',
      expiresInMinutes: 15,
    });

    return await sendEmailWithRetry(to, 'Test Email - Instagram Clone', html);
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// PASSWORD RESET EMAIL
// ============================================================================

/**
 * Renders the password reset email HTML template
 */
export function renderPasswordResetEmail(data: PasswordResetEmailData): string {
  const { username, resetLink } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #262626; font-weight: 600;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <p style="margin: 0; font-size: 16px; color: #737373; line-height: 24px;">
                Hi ${username},
              </p>
              <p style="margin: 16px 0 0; font-size: 16px; color: #737373; line-height: 24px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
            </td>
          </tr>
          
          <!-- Reset Button -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #ffffff; text-decoration: none; padding: 16px 48px; font-size: 16px; font-weight: 600; border-radius: 8px;">
                Reset Password
              </a>
            </td>
          </tr>
          
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 10px 40px 20px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #0095f6; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <!-- Expiration Notice -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                This link expires in <strong style="color: #737373;">1 hour</strong>
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #737373; line-height: 20px;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                This is an automated email from Instagram Clone. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends password reset email to user
 * @param email - Recipient email address
 * @param username - User's username for personalization
 * @param resetLink - Full URL for password reset
 * @returns Promise resolving to true if sent successfully, false otherwise
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetLink: string
): Promise<boolean> {
  try {
    // Render email template with reset data
    const html = renderPasswordResetEmail({
      username,
      resetLink,
    });

    // Send email with retry logic
    const result = await sendEmailWithRetry(
      email,
      'Reset Your Password - InstaClone',
      html
    );

    return result.success;
  } catch (error) {
    if (error instanceof EmailRateLimitError) {
      console.error('[Email] Rate limit error:', error.message);
      return false;
    }

    if (error instanceof EmailInvalidRecipientError) {
      console.error('[Email] Invalid recipient:', error.message);
      return false;
    }

    console.error('[Email] Unexpected error sending password reset:', error);
    return false;
  }
}

