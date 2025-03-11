import { NextResponse } from 'next/server';
import { creditsService } from '@/services/trial';
import { auth } from '@/utils/firebase';
import { rateLimit } from '@/utils/rate-limiter';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 'lead-sourcing', {
      interval: 60,
      limit: 5
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { niche, count } = body;

    if (!niche || !count) {
      return NextResponse.json(
        { error: 'Niche and count are required' },
        { status: 400 }
      );
    }

    // Check trial eligibility
    const trialStatus = await creditsService.checkTrialEligibility(decodedToken.uid);
    
    if (!trialStatus.canUse) {
      return NextResponse.json(
        { error: trialStatus.message },
        { status: 403 }
      );
    }

    // Limit count to remaining trial contacts
    const actualCount = Math.min(Number(count), trialStatus.remaining);

    // Track trial usage
    await creditsService.trackTrialUsage(decodedToken.uid, actualCount);

    return NextResponse.json({
      success: true,
      remaining: trialStatus.remaining - actualCount,
      meta: {
        quality_score: 0, // No leads fetched, so no quality score
        estimated_engagement: 0 // No leads fetched, so no engagement
      }
    });
  } catch (error: any) {
    console.error('Lead sourcing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
} 