import { NextResponse } from 'next/server';
import { schedulerService } from '@/services/scheduler';
import { rateLimit } from '@/utils/rate-limiter';

export async function POST(request: Request) {
  try {
    // Verify cron secret to ensure only authorized calls
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit to prevent multiple simultaneous executions
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 'process-campaigns', {
      interval: 60,
      limit: 1, // Only one execution per minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Another process is already running' },
        { status: 429 }
      );
    }

    // Process scheduled campaigns
    await schedulerService.processScheduledCampaigns();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing scheduled campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process campaigns' },
      { status: 500 }
    );
  }
} 