/**
 * Edge-compatible auth utilities for middleware
 * Does NOT import bcrypt - safe for Edge Runtime
 */

import { jwtVerify } from 'jose';

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
// JWT VERIFICATION (Edge-Compatible)
// ============================================================================

/**
 * Validates JWT_SECRET and returns as Uint8Array
 */
function getJWTSecretKey(): Uint8Array {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not defined. Please add it to your environment variables.'
    );
  }

  if (JWT_SECRET.length < 64) {
    throw new Error(
      'JWT_SECRET is too short. Must be at least 64 characters.'
    );
  }

  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Verifies a JWT token signature and expiration
 * Edge-compatible version (no bcrypt dependency)
 * @param token - JWT string to verify
 * @returns Promise resolving to decoded payload
 * @throws {TokenExpiredError} If token is expired
 * @throws {InvalidTokenError} If signature is invalid or token is malformed
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecretKey(), {
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

