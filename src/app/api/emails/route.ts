import { NextResponse } from 'next/server';
import { leadSourceService } from '@/services/lead-sourcing';
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

    // Fetch leads
    const leads = await leadSourceService.findTargetedLeads({
      niche,
      count: actualCount,
    });

    // Track trial usage
    await creditsService.trackTrialUsage(decodedToken.uid, leads.length);

    return NextResponse.json({
      success: true,
      leads,
      remaining: trialStatus.remaining - leads.length,
      meta: {
        quality_score: leads.reduce((acc, lead) => acc + lead.qualityScore, 0) / leads.length,
        estimated_engagement: leads.reduce((acc, lead) => acc + lead.engagementProbability, 0) / leads.length
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