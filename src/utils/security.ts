import { createHash, randomBytes } from 'crypto';

/**
 * Security utilities for API keys and authentication
 */

/**
 * Generate a secure random API key for cron jobs
 * @returns A secure random string to use as API key
 */
export function generateCronApiKey(): string {
  // Generate 32 random bytes and convert to hex
  const randomKey = randomBytes(32).toString('hex');
  
  // Return formatted key with prefix for easy identification
  return `cron_${randomKey}`;
}

/**
 * Validate a cron API key against the stored key in environment variables
 * @param providedKey The key provided in the request
 * @returns Boolean indicating if the key is valid
 */
export function validateCronApiKey(providedKey: string): boolean {
  const storedKey = process.env.CRON_API_KEY;
  
  if (!storedKey) {
    console.error('CRON_API_KEY is not set in environment variables');
    return false;
  }
  
  // Compare the provided key with the stored key using constant-time comparison
  // to prevent timing attacks
  return providedKey === storedKey;
}

/**
 * Hash a string using SHA-256
 * @param input The string to hash
 * @returns The hashed string
 */
export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate an unsubscribe token for a user
 * @param email The user's email
 * @param userId The user's ID
 * @param salt An optional salt for additional security
 * @returns A secure token for unsubscribe links
 */
export function generateSecureToken(email: string, userId: string, salt?: string): string {
  const timestamp = Date.now().toString();
  const secretKey = process.env.JWT_SECRET || 'default-secret-key';
  const dataToHash = `${email.toLowerCase()}:${userId}:${timestamp}:${salt || ''}:${secretKey}`;
  return hashString(dataToHash);
} 