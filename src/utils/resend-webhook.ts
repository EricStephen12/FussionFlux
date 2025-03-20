import crypto from 'crypto';

interface VerifyWebhookSignatureParams {
  payload: string;
  signature: string;
  webhookSecret: string;
}

export function verifyWebhookSignature({
  payload,
  signature,
  webhookSecret,
}: VerifyWebhookSignatureParams): boolean {
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
} 