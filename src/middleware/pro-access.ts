import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/utils/firebase-admin';
import { db } from '@/utils/firebase-admin';

export async function middleware(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify the session
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    
    // Get user's subscription
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    if (!userData || (userData.subscriptionTier !== 'pro' && userData.subscription?.status !== 'trial')) {
      // Redirect non-pro and non-trial users to upgrade page
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