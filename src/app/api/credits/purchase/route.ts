import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { creditsService } from '@/services/trial';
import { stripeService } from '@/services/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, amount } = await request.json();
    
    // Validate input
    if (!type || !amount || !['EMAIL', 'SMS'].includes(type)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    if (amount < 1) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Calculate price
    const priceDetails = creditsService.calculateExtraCreditPrice(type, amount);

    // Create Stripe payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: Math.round(priceDetails.finalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: session.user.id,
        type,
        amount,
        basePrice: priceDetails.basePrice,
        discount: priceDetails.discount
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      priceDetails
    });

  } catch (error) {
    console.error('Error processing extra credit purchase:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}

// Webhook to handle successful payments
export async function PUT(request: Request) {
  try {
    const { paymentIntentId } = await request.json();
    
    // Verify payment intent
    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      );
    }

    const { userId, type, amount } = paymentIntent.metadata;

    // Add credits to user account
    await creditsService.purchaseExtraCredits(
      userId,
      type.toLowerCase(),
      parseInt(amount),
      paymentIntentId
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing successful payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 