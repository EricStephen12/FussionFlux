import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { logger } from '@/utils/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-auth-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-storage-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'mock-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'mock-app-id'
};

// Initialize Firebase for client-side
const apps = getApps();
const app = !apps.length ? initializeApp(firebaseConfig) : apps[0];

export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper function to handle Google authentication
export const signInWithGoogle = async (referralCode?: string | null) => {
  try {
    console.log('Initiating Google sign-in...');
    const provider = new GoogleAuthProvider();
    
    // Add referral code to the provider if provided
    if (referralCode) {
      console.log('Adding referral code to Google sign-in:', referralCode);
      provider.setCustomParameters({
        'referral_code': referralCode
      });
    }
    
    // Configure provider scopes
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
    // Attempt sign-in with popup
    const result = await signInWithPopup(auth, provider);
    console.log('Google sign-in successful:', result.user.email);
    
    // Store minimal user data in localStorage for offline access
    try {
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastSignIn: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('User data stored in localStorage');
    } catch (storageError) {
      console.error('Error storing user data:', storageError);
    }
    
    return result;
    
  } catch (error: any) {
    console.error('Google authentication failed:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to sign in with Google. Please try again.';
    
    if (error.code === 'popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (error.code === 'popup-blocked') {
      errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    }
    
    logger.error('Google authentication failed:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    throw new Error(errorMessage);
  }
};

// Helper function to convert Firestore Timestamp to ISO string
export const timestampToISO = (timestamp: any) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

export const docToJSON = (doc: any) => {
  if (!doc.exists) return null;
  
  const data = doc.data();
  const id = doc.id;
  
  const processedData = Object.entries(data).reduce((acc: any, [key, value]) => {
    if (value && typeof value === 'object' && value.toDate) {
      acc[key] = timestampToISO(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  return {
    id,
    ...processedData
  };
}; 