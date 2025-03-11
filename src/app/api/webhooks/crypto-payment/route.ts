import { NextResponse } from 'next/server';
import { cryptoPaymentService } from '@/services/crypto-payment';
import { rateLimit } from '@/utils/rate-limiter';

export async function POST(request: Request) {
  try {
    // Verify IPN signature
    const signature = request.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const data = await request.json();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing crypto payment webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'edge'; 