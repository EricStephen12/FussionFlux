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
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
} 