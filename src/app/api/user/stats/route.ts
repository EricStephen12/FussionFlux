import { NextResponse } from 'next/server';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user document
    const userRef = doc(db, 'users', decodedToken.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Get campaigns count
    const campaignsRef = collection(db, 'campaigns');
    const campaignsQuery = query(
      campaignsRef,
      where('userId', '==', decodedToken.uid),
      orderBy('createdAt', 'desc')
    );
    const campaignsSnapshot = await getDocs(campaignsQuery);
    
    // Calculate campaign stats
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;

    campaignsSnapshot.forEach((doc) => {
      const campaign = doc.data();
      totalSent += campaign.sentCount || 0;
      totalOpened += campaign.openCount || 0;
      totalClicked += campaign.clickCount || 0;
    });

    // Get Shopify store details
    const shopifyStore = userData.shopifyStore || {};

    // Calculate response rate
    const responseRate = totalSent > 0 
      ? Math.round((totalOpened / totalSent) * 100) 
      : 0;

    return NextResponse.json({
      credits: userData.credits || 50, // Default to 50 for trial
      usedCredits: userData.usedCredits || 0,
      isTrialActive: !userData.subscription,
      shopifyVerified: shopifyStore.isVerified || false,
      campaignsCount: campaignsSnapshot.size,
      verifiedLeads: userData.verifiedLeads || 0,
      responseRate,
      productsCount: userData.productsCount || 0,
    });

  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}