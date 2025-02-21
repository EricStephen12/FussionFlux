import { NextResponse } from 'next/server';
import { auth } from '@/utils/firebase';
import { firestoreService } from '@/services/firestore';

interface VerifyPaymentRequest {
  transactionId: string;
  paymentMethod: 'flutterwave' | 'paypal';
  planId: string;
}

export async function POST(request: Request) {
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

    const { transactionId, paymentMethod, planId } = (await request.json()) as VerifyPaymentRequest;

    if (!transactionId || !paymentMethod || !planId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify payment with respective payment provider
    let isVerified = false;
    if (paymentMethod === 'flutterwave') {
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );
      const data = await response.json();
      isVerified = data.status === 'successful';
    } else if (paymentMethod === 'paypal') {
      const response = await fetch(
        `https://api-m.paypal.com/v2/checkout/orders/${transactionId}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
            ).toString('base64')}`,
          },
        }
      );
      const data = await response.json();
      isVerified = data.status === 'COMPLETED';
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get credits from plan
    const plans = [
      { id: 'basic', credits: 1000 },
      { id: 'pro', credits: 5000 },
      { id: 'enterprise', credits: 15000 },
    ];
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Update user credits in Firestore
    await firestoreService.updateUserCredits(decodedToken.uid, plan.credits);

    // Record the transaction
    await firestoreService.recordTransaction({
      userId: decodedToken.uid,
      transactionId,
      paymentMethod,
      planId,
      credits: plan.credits,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      credits: plan.credits,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
} 