import { NextResponse } from 'next/server';
import { auth } from '@/utils/firebase';
import { domainVerificationService } from '@/services/domain-verification';
import { rateLimit } from '@/utils/rate-limiter';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Rate limit domain verification attempts
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 'domain-verify', {
      interval: 3600, // 1 hour
      limit: 5, // 5 attempts per hour
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts' },
        { status: 429 }
      );
    }

    const { domain } = await request.json();
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Add domain to Resend
    const result = await domainVerificationService.addDomain(domain);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      records: result.records,
      message: 'Domain added successfully. Please add the DNS records to verify your domain.',
    });
  } catch (error: any) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify domain' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // Get domain status
    const result = await domainVerificationService.getDomainStatus(domain);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
    });
  } catch (error: any) {
    console.error('Domain status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check domain status' },
      { status: 500 }
    );
  }
} 