import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
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

    // Get user document reference
    const userRef = db.collection('users').doc(event.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different subscription events
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        Object.assign(updateData, {
          subscriptionStatus: event.status,
          subscriptionPlan: event.planId,
          subscriptionInterval: event.interval,
          subscriptionStartDate: event.startDate,
          subscriptionEndDate: event.endDate
        });
        break;

      case 'subscription.cancelled':
        Object.assign(updateData, {
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: new Date().toISOString()
        });
        break;

      case 'subscription.trial_ending':
        Object.assign(updateData, {
          trialEndingNotified: true
        });
        break;

      default:
        console.warn('Unhandled webhook event type:', event.type);
    }

    // Update user document
    await userRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 