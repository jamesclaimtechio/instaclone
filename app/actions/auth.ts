'use server';

import { db, users } from '@/db';
import { hashPassword, generateToken, setAuthCookie, deleteAuthCookie, verifyPassword } from '@/lib/auth';
import { sendOTPToUser } from '@/lib/otp';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

type RegistrationError = {
  success: false;
  error: {
    field: 'email' | 'username' | 'password' | 'general';
    message: string;
  };
};

type RegistrationSuccess = {
  success: true;
  redirect: string;
};

type RegistrationResult = RegistrationError | RegistrationSuccess;

type LoginError = {
  success: false;
  error: {
    message: string;
  };
};

type LoginSuccess = {
  success: true;
  redirect: string;
};

type LoginResult = LoginError | LoginSuccess;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates email format using simplified RFC 5322 regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates username format (alphanumeric, underscore, hyphen only)
 */
function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
}

/**
 * Validates password requirements
 */
function isValidPassword(password: string): boolean {
  const trimmed = password.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Registers a new user with email, password, and username
 * Automatically logs in the user after successful registration
 */
export async function registerUser(
  formData: FormData
): Promise<RegistrationResult> {
  try {
    // Extract and sanitize form data
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    const username = formData.get('username')?.toString().trim() || '';

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return {
        success: false,
        error: {
          field: 'email',
          message: 'Please enter a valid email address',
        },
      };
    }

    // Validate username format
    if (!username || !isValidUsername(username)) {
      return {
        success: false,
        error: {
          field: 'username',
          message: 'Username can only contain letters, numbers, underscores, and hyphens',
        },
      };
    }

    // Validate password
    if (!isValidPassword(password)) {
      return {
        success: false,
        error: {
          field: 'password',
          message: password.trim().length === 0
            ? 'Password is required'
            : 'Password is too long (max 1000 characters)',
        },
      };
    }

    // Check email uniqueness (case-insensitive)
    const normalizedEmail = email.toLowerCase();
    const existingEmailUser = await db.query.users.findFirst({
      where: sql`LOWER(${users.email}) = ${normalizedEmail}`,
    });

    if (existingEmailUser) {
      return {
        success: false,
        error: {
          field: 'email',
          message: 'This email is already registered',
        },
      };
    }

    // Check username uniqueness (case-sensitive)
    const existingUsernameUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUsernameUser) {
      return {
        success: false,
        error: {
          field: 'username',
          message: 'This username is already taken',
        },
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in database
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          username,
          passwordHash,
          emailVerified: false,
          isAdmin: false,
        })
        .returning();

      if (!newUser) {
        return {
          success: false,
          error: {
            field: 'general',
            message: 'Failed to create user account. Please try again.',
          },
        };
      }

      // Generate JWT and set cookie for automatic login
      const token = await generateToken(newUser.id, newUser.isAdmin);
      await setAuthCookie(token);

      // Send OTP verification email (don't block on failure)
      // User can request resend if email fails
      await sendOTPToUser(newUser.id, newUser.email, newUser.username);

      // Redirect to verification page after successful registration
      redirect('/verify');
    } catch (insertError: any) {
      // Handle race condition: unique constraint violation
      if (insertError.code === '23505') {
        // Postgres unique violation error code
        const errorMessage = insertError.message || '';
        
        if (errorMessage.includes('email')) {
          return {
            success: false,
            error: {
              field: 'email',
              message: 'This email is already registered',
            },
          };
        }
        
        if (errorMessage.includes('username')) {
          return {
            success: false,
            error: {
              field: 'username',
              message: 'This username is already taken',
            },
          };
        }
      }

      // Re-throw NEXT_REDIRECT - it's not an error, it's how redirect() works
      if (insertError?.digest?.includes('NEXT_REDIRECT')) {
        throw insertError;
      }

      // Re-throw unexpected errors to be caught by outer try-catch
      throw insertError;
    }
  } catch (error: any) {
    // NEXT_REDIRECT is thrown by redirect() - let it propagate, don't catch!
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('Registration error:', error);
    return {
      success: false,
      error: {
        field: 'general',
        message: 'Something went wrong. Please try again.',
      },
    };
  }
}

/**
 * Logs in a user with email and password
 * Uses timing-safe password verification to prevent user enumeration
 */
export async function loginUser(formData: FormData): Promise<LoginResult> {
  try {
    // Extract and sanitize form data
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return {
        success: false,
        error: {
          message: 'Please enter a valid email address',
        },
      };
    }

    // Validate password is present
    if (!password || password.trim().length === 0) {
      return {
        success: false,
        error: {
          message: 'Password is required',
        },
      };
    }

    // Look up user by email (case-insensitive)
    const normalizedEmail = email.toLowerCase();
    const user = await db.query.users.findFirst({
      where: sql`LOWER(${users.email}) = ${normalizedEmail}`,
    });

    // Timing-safe handling: if user not found, hash dummy password to maintain consistent timing
    if (!user) {
      // Hash a dummy password to make timing consistent with the password verification path
      await hashPassword('dummy_password_for_timing_safety_12345');
      return {
        success: false,
        error: {
          message: 'Invalid credentials',
        },
      };
    }

    // Verify password using timing-safe bcrypt comparison
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: {
          message: 'Invalid credentials',
        },
      };
    }

    // Password is correct - generate JWT and set cookie
    const token = await generateToken(user.id, user.isAdmin);
    await setAuthCookie(token);

    // Redirect to feed after successful login
    redirect('/');
  } catch (error: any) {
    // NEXT_REDIRECT is thrown by redirect() - let it propagate, don't catch!
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        message: 'Something went wrong. Please try again.',
      },
    };
  }
}

/**
 * Logs out the current user by clearing the authentication cookie
 */
export async function logoutUser(): Promise<void> {
  await deleteAuthCookie();
  redirect('/login');
}

