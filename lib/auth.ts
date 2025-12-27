import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

// ============================================================================
// CONSTANTS
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION_DAYS = 30;
const BCRYPT_ROUNDS = 12;
const COOKIE_NAME = 'auth_token';

// Validate JWT_SECRET on module load
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not defined. Please add it to your .env.local file.\n' +
      'Generate with: openssl rand -hex 32\n' +
      'Must be at least 64 characters for HS256 security.'
  );
}

if (JWT_SECRET.length < 64) {
  throw new Error(
    'JWT_SECRET is too short. Must be at least 64 characters.\n' +
      'Generate a stronger secret with: openssl rand -hex 32'
  );
}

// Convert JWT_SECRET to Uint8Array for jose
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// ============================================================================
// TYPES
// ============================================================================

export interface JWTPayload {
  userId: string;
  isAdmin: boolean;
  exp: number;
  iat: number;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class TokenExpiredError extends Error {
  constructor(message = 'Token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message = 'Invalid token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Hashes a plain text password using bcrypt with cost factor 12
 * @param password - Plain text password to hash
 * @returns Promise resolving to bcrypt hash (60 characters)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a bcrypt hash using timing-safe comparison
 * @param password - Plain text password to verify
 * @param hash - Stored bcrypt hash
 * @returns Promise resolving to true if match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

/**
 * Generates a signed JWT token with user identity
 * @param userId - User's UUID from database
 * @param isAdmin - Whether user has admin privileges
 * @returns Promise resolving to signed JWT string
 */
export async function generateToken(
  userId: string,
  isAdmin: boolean = false
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_EXPIRATION_DAYS * 24 * 60 * 60; // 30 days in seconds

  const token = await new SignJWT({
    userId,
    isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET_KEY);

  return token;
}

/**
 * Verifies a JWT token signature and expiration
 * @param token - JWT string to verify
 * @returns Promise resolving to decoded payload
 * @throws {TokenExpiredError} If token is expired
 * @throws {InvalidTokenError} If signature is invalid or token is malformed
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      algorithms: ['HS256'],
    });

    return {
      userId: payload.userId as string,
      isAdmin: payload.isAdmin as boolean,
      exp: payload.exp as number,
      iat: payload.iat as number,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Check if token is expired
      if (error.message.includes('exp') || error.message.includes('expired')) {
        throw new TokenExpiredError();
      }
      // All other errors are invalid token
      throw new InvalidTokenError(error.message);
    }
    throw new InvalidTokenError();
  }
}

// ============================================================================
// COOKIE UTILITIES
// ============================================================================

/**
 * Sets the authentication token in an HTTP-only cookie
 * @param token - JWT string to store
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRATION_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: '/',
  });
}

/**
 * Reads the authentication token from cookies
 * @returns JWT string if present, undefined otherwise
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value;
}

/**
 * Deletes the authentication cookie (logout)
 */
export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Gets the currently authenticated user from the request cookie
 * @returns Promise resolving to JWT payload if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const token = await getAuthCookie();
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    return payload;
  } catch (error) {
    // Token invalid or expired - treat as not authenticated
    return null;
  }
}

