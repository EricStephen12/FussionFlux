import { NextResponse } from 'next/server';
import { cryptoPaymentService } from '@/services/crypto-payment';
import { rateLimit } from '@/utils/rate-limiter';
import crypto from 'crypto';

function verifyIPNSignature(data: any, signature: string): boolean {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = data[key];
      return acc;
    }, {});

  const stringifiedData = JSON.stringify(sortedData);
  const expectedSignature = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET || '')
    .update(stringifiedData)
    .digest('hex');

  return signature === expectedSignature;
}

export async function POST(request: Request) {
  try {
    // Rate limit to prevent abuse
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 'crypto-webhook', {
      interval: 60,
      limit: 100, // Allow up to 100 callbacks per minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Verify IPN signature
    const signature = request.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const data = await request.json();
    if (!verifyIPNSignature(data, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process the payment callback
    await cryptoPaymentService.processIPNCallback(data);

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