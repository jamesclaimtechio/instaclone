'use server';

import { db, users } from '@/db';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
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

      // Redirect to feed after successful registration
      redirect('/');
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

      // Re-throw unexpected errors to be caught by outer try-catch
      throw insertError;
    }
  } catch (error) {
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

