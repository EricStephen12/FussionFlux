import { auth } from '@/utils/firebase-admin';

interface Session {
  sub: string;  // User ID
  email?: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify a Firebase ID token and return session information
 * @param token Firebase ID token
 * @returns Session object with user information or null if invalid
 */
export async function verifyAuth(token: string): Promise<Session | null> {
  try {
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      console.error('Invalid token: missing uid');
      return null;
    }
    
    // Create session object
    const session: Session = {
      sub: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      role: decodedToken.role || 'user',
      iat: decodedToken.iat,
      exp: decodedToken.exp,
    };
    
    return session;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

/**
 * Get the current user's ID from a Firebase ID token
 * @param token Firebase ID token
 * @returns User ID or null if invalid
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const session = await verifyAuth(token);
    return session?.sub || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
}

/**
 * Check if a user has admin privileges
 * @param userId User ID to check
 * @returns Promise that resolves to true if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userRecord = await auth.getUser(userId);
    const customClaims = userRecord.customClaims || {};
    return customClaims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
} 