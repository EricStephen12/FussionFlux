import { db } from '@/utils/firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { userId, creditType, amount } = await request.json();

    if (!userId || !creditType || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user's credits
    const creditField = `total${creditType.charAt(0).toUpperCase() + creditType.slice(1)}s`;
    await updateDoc(userRef, {
      [creditField]: increment(amount),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    return new Response(JSON.stringify({ error: 'Failed to process purchase' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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