import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const apps = getApps();

if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

export const db = getFirestore();
export const auth = getAuth();

// Helper function to convert Firestore Timestamp to ISO string
export const timestampToISO = (timestamp: any) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/**
 * Helper function to convert Firestore document to JSON
 * @param doc Firestore document
 * @returns Document data with ID and converted timestamps
 */
export const docToJSON = (doc: any) => {
  if (!doc.exists) return null;
  
  const data = doc.data();
  const id = doc.id;
  
  // Convert all timestamp fields to ISO strings
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