import { db } from '@/utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import crypto from 'crypto';

export async function verifyApiKey(apiKey: string): Promise<string | null> {
  try {
    const apiKeysRef = collection(db, 'api_keys');
    const q = query(apiKeysRef, where('key', '==', apiKey), where('active', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const apiKeyDoc = snapshot.docs[0];
    const apiKeyData = apiKeyDoc.data();

    // Check if key is expired
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      return null;
    }

    return apiKeyData.userId;
  } catch (error) {
    console.error('API key verification error:', error);
    return null;
  }
}

export function generateApiKey(userId: string): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  const data = `${userId}-${timestamp}-${random}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function createApiKey(userId: string): Promise<{
  key: string;
  expiresAt: string;
}> {
  const key = generateApiKey(userId);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Key expires in 1 year

  await db.collection('api_keys').add({
    userId,
    key,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  return {
    key,
    expiresAt: expiresAt.toISOString(),
  };
} 