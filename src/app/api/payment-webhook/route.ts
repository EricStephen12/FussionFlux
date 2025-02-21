import { NextResponse } from 'next/server';
import { paymentService } from '@/services/payment';
import { verifyIPNSignature } from '@/lib/nowpayments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-nowpayments-sig');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify IPN signature
    const isValidSignature = verifyIPNSignature(
      JSON.stringify(body),
      signature,
      process.env.NOWPAYMENTS_IPN_SECRET!
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process the payment notification
    const { order_id, payment_status } = body;

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      await paymentService.verifyPayment(order_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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