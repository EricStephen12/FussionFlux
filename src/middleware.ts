import { withSentryConfig } from "@sentry/nextjs";
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/utils/firebase';

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
  const path = request.nextUrl.pathname;
  let token;

  // Check if the path is protected
  if (protectedPaths.some(prefix => path.startsWith(prefix))) {
    // Add your authentication logic here
    token = request.cookies.get('session');
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check if the path is auth-only and user is authenticated
  if (authPaths.includes(path) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add Sentry tracking headers
  const response = NextResponse.next();
  response.headers.set('x-sentry-trace', request.headers.get('x-sentry-trace') || '');
  response.headers.set('baggage', request.headers.get('baggage') || '');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 