// Remove the import of the crypto module
// import crypto from 'crypto';

interface VerifyWebhookSignatureParams {
  payload: string;
  signature: string;
  webhookSecret: string;
}

// Remove the verifyWebhookSignature function and related logic
// export function verifyWebhookSignature({
//   payload,
//   signature,
//   webhookSecret,
// }: VerifyWebhookSignatureParams): boolean {
//   try {
//     const expectedSignature = crypto
//       .createHmac('sha256', webhookSecret)
//       .update(payload)
//       .digest('hex');

//     return crypto.timingSafeEqual(
//       Buffer.from(expectedSignature),
//       Buffer.from(signature)
//     );
//   } catch (error) {
//     console.error('Resend webhook signature verification error:', error);
//     return false;
//   }
// } 