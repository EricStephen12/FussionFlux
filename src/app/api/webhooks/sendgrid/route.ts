import { NextResponse } from 'next/server';
import { firestoreService } from '@/services/firestore';
import { verifyWebhookSignature } from '@/utils/resend-webhook';

interface ResendEvent {
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';
  email: string;
  timestamp: string;
  tags: Array<{ name: string; value: string }>;
}

export async function POST(request: Request) {
  try {
    // Verify Resend webhook signature
    const signature = request.headers.get('Resend-Signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 401 }
      );
    }

    const rawBody = await request.text();
    const isValid = verifyWebhookSignature({
      payload: rawBody,
      signature,
      webhookSecret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody) as ResendEvent;
    const campaignId = event.tags.find(tag => tag.name === 'campaign_id')?.value;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID not found in event' },
        { status: 400 }
      );
    }

    // Update campaign stats based on event type
    switch (event.type) {
      case 'delivered':
        await firestoreService.incrementCampaignStats(campaignId, {
          sentCount: 1,
        });
        break;
      case 'opened':
        await firestoreService.incrementCampaignStats(campaignId, {
          openCount: 1,
        });
        break;
      case 'clicked':
        await firestoreService.incrementCampaignStats(campaignId, {
          clickCount: 1,
        });
        break;
      case 'bounced':
        // Handle bounces by marking the email as invalid
        console.log(`Email bounced for campaign ${campaignId}: ${event.email}`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Resend webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Disable body parsing since we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}; 