import { withSentryConfig } from "@sentry/nextjs";
import { NextResponse, NextRequest } from 'next/server';

// Add paths that should be accessible only to authenticated users
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/campaigns',
  '/analytics'
];

// Add paths that should be accessible only to non-authenticated users
const authPaths = [
  '/login',
  '/signup',
  '/forgot-password',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // For API routes, allow them to run server-side
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // We can't reliably check Firebase auth in middleware,
  // so we'll handle auth redirects client-side in the components instead
  // This ensures the AuthContext works properly before redirects happen
  
  // For dashboard routes, just add security headers
  if (pathname.includes('/dashboard/')) {
    // Clone the response
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  // Add Sentry tracking headers
  const response = NextResponse.next();
  response.headers.set('x-sentry-trace', request.headers.get('x-sentry-trace') || '');
  response.headers.set('baggage', request.headers.get('baggage') || '');
  
  return response;
}

// Configure matching paths for the middleware
export const config = {
  matcher: [
    // Original auth matcher paths
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    // API and dashboard-specific paths
    '/dashboard/:path*',
    '/api/:path*',
  ],
}; 