import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Get campaign data using Admin SDK
    const campaignRef = db.collection('campaigns').doc(id);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update campaign status using Admin SDK
    await campaignRef.update({
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
} 