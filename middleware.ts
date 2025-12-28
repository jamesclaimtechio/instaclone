import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenExpiredError, InvalidTokenError } from '@/lib/auth';

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/'];

// Auth routes that authenticated users shouldn't access (redirect to feed)
const AUTH_ROUTES = ['/login', '/register'];

// Cookie name (must match lib/auth.ts)
const COOKIE_NAME = 'auth_token';

// ============================================================================
// MIDDLEWARE
// ============================================================================

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Read authentication token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;

    // Verify JWT and get user context
    let userId: string | null = null;
    let isAdmin: boolean = false;

    if (token) {
      try {
        const payload = await verifyToken(token);
        userId = payload.userId;
        isAdmin = payload.isAdmin;
      } catch (error) {
        // Token invalid, expired, or malformed - treat as unauthenticated
        // Errors are expected (expired tokens, tampered tokens, etc.)
        userId = null;
        isAdmin = false;
      }
    }

  const isAuthenticated = userId !== null;

  // If authenticated user visits auth routes (/login, /register), redirect to feed
  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If unauthenticated user visits protected route, redirect to login
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    
    // Preserve the original URL to return after login (prevent open redirect)
    if (pathname && pathname !== '/' && pathname.startsWith('/')) {
      loginUrl.searchParams.set('returnUrl', pathname);
    }
    
    return NextResponse.redirect(loginUrl);
  }

  // For authenticated requests, inject user context into headers
  // This makes user identity available in Server Components and Server Actions
  const response = NextResponse.next();
  
  if (isAuthenticated && userId) {
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-is-admin', String(isAdmin));
  }

    return response;
  } catch (error) {
    // Catch any unexpected errors in middleware
    console.error('[Middleware Error]:', error);
    // Allow request to proceed on error (fail open for better UX)
    return NextResponse.next();
  }
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Exclude static assets and Next.js internals from middleware
// This improves performance by not running auth checks on images, CSS, JS
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

