import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { verifyAuth } from '@/utils/auth-server';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const session = await verifyAuth(token);
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get campaigns from Firestore
    const campaignsRef = db.collection('campaigns');
    const snapshot = await campaignsRef.where('userId', '==', session.sub).get();
    
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings for JSON serialization
      startDate: doc.data().startDate?.toDate?.() 
        ? doc.data().startDate.toDate().toISOString() 
        : doc.data().startDate
    }));

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
} 