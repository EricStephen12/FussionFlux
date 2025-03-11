import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { firestoreService } from '@/services/firestore';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Get campaign data
    const campaign = await firestoreService.getCampaign(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update campaign status in database
    const campaignRef = doc(db, 'campaigns', id);
    await updateDoc(campaignRef, {
      status: 'sent',
      sentAt: new Date(),
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