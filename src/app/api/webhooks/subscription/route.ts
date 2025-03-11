import { NextResponse } from 'next/server';
import { firestoreService } from '@/services/firestore';
import { verifyWebhookSignature } from '@/utils/webhook';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different subscription events
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await firestoreService.updateUserDocument(event.userId, {
          subscriptionStatus: event.status,
          subscriptionPlan: event.planId,
          subscriptionInterval: event.interval,
          subscriptionStartDate: event.startDate,
          subscriptionEndDate: event.endDate,
          updatedAt: new Date().toISOString(),
        });
        break;

      case 'subscription.cancelled':
        await firestoreService.updateUserDocument(event.userId, {
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        break;

      case 'subscription.trial_ending':
        // Send trial ending notification
        await firestoreService.updateUserDocument(event.userId, {
          trialEndingNotified: true,
          updatedAt: new Date().toISOString(),
        });
        break;

      default:
        console.warn('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 