import { NextResponse } from 'next/server';
import { firestoreService } from '@/services/firestore';
import { rateLimit } from '@/utils/rate-limiter';
import type { ErrorDetails } from '@/utils/error-monitoring';

export async function POST(request: Request) {
  try {
    // Rate limit error logging
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 'error-log', {
      interval: 60,
      limit: 10, // Max 10 errors per minute per IP
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many error logs' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const errorData = (await request.json()) as ErrorDetails;

    // Store error in Firestore
    await firestoreService.addDocument('error_logs', {
      ...errorData,
      ip,
      timestamp: new Date().toISOString(),
    });

    // Here you could also integrate with other error tracking services
    // like Sentry, LogRocket, etc.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
} 