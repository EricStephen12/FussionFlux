import { NextResponse } from 'next/server';
import { auth } from '@/utils/firebase';
import { firestoreService } from '@/services/firestore';
import { verifyApiKey } from '@/utils/api-auth';
import { apiUsageService } from '@/services/api-usage';
import { RateLimitService } from '@/services/rate-limit';
import { apolloService } from '@/services/apollo';
import { creditsService } from '@/services/trial';

const rateLimitService = new RateLimitService();

export async function GET(request: Request) {
  try {
    // 1. Verify API key
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const userId = await verifyApiKey(apiKey);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // 2. Check credits
    const eligibility = await creditsService.checkTrialEligibility(userId);
    if (!eligibility.canUse) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        message: eligibility.message
      }, { status: 403 });
    }

    // 3. Parse search parameters
    const url = new URL(request.url);
    const industry = url.searchParams.getAll('industry');
    const title = url.searchParams.getAll('title');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // 4. Search contacts
    const contacts = await apolloService.searchContacts({
      industry,
      title,
      limit
    });

    // 5. Deduct credits
    await creditsService.trackUsage(userId, 'email', 1);

    // 6. Return results
    return NextResponse.json({
      success: true,
      data: contacts,
      remaining_credits: eligibility.remainingEmail
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { 
      status: error.status || 500 
    });
  }
}

export async function POST(request: Request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const userId = await verifyApiKey(apiKey);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Check if user has Pro subscription or is in trial
    const user = await firestoreService.getUserDocument(userId);
    const tier = user?.subscriptionTier === 'pro' ? 'pro' : 
                user?.subscription?.status === 'trial' ? 'trial' : 'default';

    // Check rate limit
    const rateLimitResult = await rateLimitService.isRateLimited(userId, tier);
    if (rateLimitResult.limited) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        resetTime: rateLimitResult.resetTime,
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitService.getRateLimitConfig(tier).max.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      });
    }

    if (tier === 'default') {
      return NextResponse.json({ error: 'This API is only available for Pro users and trial users' }, { status: 403 });
    }

    // Track API usage
    await apiUsageService.trackRequest(userId, 'POST /api/v1/leads');

    const body = await request.json();
    
    // Validate lead data
    if (!body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Required fields missing: email, firstName, lastName' },
        { status: 400 }
      );
    }

    // Add lead
    const lead = await firestoreService.addLead(userId, body);

    return NextResponse.json({
      success: true,
      data: lead
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitService.getRateLimitConfig(tier).max.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 