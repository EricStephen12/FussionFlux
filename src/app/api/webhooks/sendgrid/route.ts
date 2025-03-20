import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
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

    // Get campaign document reference
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update campaign stats based on event type
    const updateData: Record<string, any> = {
      lastUpdatedAt: new Date().toISOString()
    };

    switch (event.type) {
      case 'delivered':
        updateData.sentCount = (campaignDoc.data()?.sentCount || 0) + 1;
        break;
      case 'opened':
        updateData.openCount = (campaignDoc.data()?.openCount || 0) + 1;
        if (!campaignDoc.data()?.firstOpenAt) {
          updateData.firstOpenAt = new Date().toISOString();
        }
        break;
      case 'clicked':
        updateData.clickCount = (campaignDoc.data()?.clickCount || 0) + 1;
        if (!campaignDoc.data()?.firstClickAt) {
          updateData.firstClickAt = new Date().toISOString();
        }
        break;
      case 'bounced':
        // Add the bounced email to a list of invalid emails
        updateData.bouncedEmails = [...(campaignDoc.data()?.bouncedEmails || []), event.email];
        break;
    }

    await campaignRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Resend webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Only keep dynamic flag, remove edge runtime
export const dynamic = 'force-dynamic'; 