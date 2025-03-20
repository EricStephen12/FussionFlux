import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { verifyApiKey } from '@/utils/api-auth';
import { apolloService } from '@/services/apollo';

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
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const usedLeads = userData.usedLeads || 0;
    const totalLeads = userData.totalLeads || 100;

    if (usedLeads >= totalLeads) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        message: 'You have used all your available leads. Please upgrade your plan.'
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

    // 5. Update usage
    await userRef.update({
      usedLeads: usedLeads + 1,
      lastLeadUsedAt: new Date().toISOString()
    });

    // 6. Return results
    return NextResponse.json({
      success: true,
      data: contacts,
      remaining_credits: totalLeads - (usedLeads + 1)
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
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const tier = userData.subscriptionTier === 'pro' ? 'pro' : 
                userData.subscription?.status === 'trial' ? 'trial' : 'default';

    // Check rate limits based on tier
    const rateLimit = {
      pro: 1000,
      trial: 100,
      default: 0
    }[tier];

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Get today's usage
    const usageRef = db.collection('api_usage')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startOfDay);
    
    const usageSnapshot = await usageRef.get();
    const todayUsage = usageSnapshot.size;

    if (todayUsage >= rateLimit) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        resetTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
      }, { status: 429 });
    }

    if (tier === 'default') {
      return NextResponse.json({ error: 'This API is only available for Pro users and trial users' }, { status: 403 });
    }

    // Track API usage
    await db.collection('api_usage').add({
      userId,
      endpoint: 'POST /api/v1/leads',
      timestamp: new Date().toISOString()
    });

    const body = await request.json();
    
    // Validate lead data
    if (!body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Required fields missing: email, firstName, lastName' },
        { status: 400 }
      );
    }

    // Add lead
    const leadRef = await db.collection('leads').add({
      ...body,
      userId,
      createdAt: new Date().toISOString(),
      status: 'new'
    });

    const lead = {
      id: leadRef.id,
      ...body,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: lead,
      remaining: rateLimit - (todayUsage + 1)
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 