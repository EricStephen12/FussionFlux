import { NextResponse } from 'next/server';
import { auth } from '@/utils/firebase';
import { firestoreService } from '@/services/firestore';
import { creditsService } from '@/services/trial';

interface VerifyPaymentRequest {
  transactionId: string;
  paymentMethod: 'flutterwave' | 'paypal' | 'nowpayments';
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
    } else if (paymentMethod === 'nowpayments') {
      const response = await fetch(
        `https://api.nowpayments.io/v1/payment/${transactionId}`,
        {
          headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
          },
        }
      );
      const data = await response.json();
      isVerified = data.payment_status === 'finished';
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get credits from plan
    const plans = [
      { id: 'starter', emailCredits: 150, smsCredits: 100, price: 29 },
      { id: 'growth', emailCredits: 500, smsCredits: 500, price: 79 },
      { id: 'pro', emailCredits: 1500, smsCredits: 1500, price: 149 }
    ];
    
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Add both email and SMS credits
    await creditsService.addCredits(decodedToken.uid, 'email', plan.emailCredits);
    await creditsService.addCredits(decodedToken.uid, 'sms', plan.smsCredits);

    // Record the transaction
    await firestoreService.recordTransaction({
      userId: decodedToken.uid,
      transactionId,
      paymentMethod,
      planId,
      emailCredits: plan.emailCredits,
      smsCredits: plan.smsCredits,
      amount: plan.price,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      emailCredits: plan.emailCredits,
      smsCredits: plan.smsCredits,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
} 