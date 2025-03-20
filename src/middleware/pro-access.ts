import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/utils/auth-server';

export async function middleware(request: NextRequest) {
  try {
    // Get the session token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const token = authHeader.split('Bearer ')[1];
    const session = await verifyAuth(token);
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For pro routes, you can add additional checks here
    // For example, checking a pro status claim in the JWT
    if (!session.pro) {
      return NextResponse.redirect(new URL('/dashboard/billing', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Pro access middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/pro/:path*']
} 