import crypto from 'crypto';

export function verifyWebhookSignature(payload: string, signature?: string | null): boolean {
  if (!signature) return false;
  
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Webhook secret is not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
} 