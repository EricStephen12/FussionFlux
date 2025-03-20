import { NextResponse } from 'next/server';
import { verifyAuth } from '@/utils/auth-server';
import { db } from '@/utils/firebase-admin';

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
    const session = await verifyAuth(token);
    
    if (!session) {
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

    // Get user document reference
    const userRef = db.collection('users').doc(session.sub);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() || {};

    // Update user credits
    await userRef.update({
      'extraCredits.extraEmails': (userData.extraCredits?.extraEmails || 0) + plan.emailCredits,
      'extraCredits.extraSMS': (userData.extraCredits?.extraSMS || 0) + plan.smsCredits,
      updatedAt: new Date().toISOString()
    });

    // Record the transaction
    await db.collection('transactions').add({
      userId: session.sub,
      transactionId,
      paymentMethod,
      planId,
      emailCredits: plan.emailCredits,
      smsCredits: plan.smsCredits,
      amount: plan.price,
      timestamp: new Date().toISOString()
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