import { db } from '@/utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const getReferralData = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  return userDoc.data(); // Return the referral data
}; 