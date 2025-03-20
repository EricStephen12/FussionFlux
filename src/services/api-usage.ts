import { db } from '@/utils/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export class ApiUsageService {
  async trackUsage(userId: string, type: 'email' | 'sms' | 'lead', count: number = 1) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const usageField = `used${type.charAt(0).toUpperCase() + type.slice(1)}s`;
      const totalField = `total${type.charAt(0).toUpperCase() + type.slice(1)}s`;

      if (userData[usageField] + count > userData[totalField]) {
        throw new Error(`${type} limit exceeded`);
      }

      await updateDoc(userRef, {
        [usageField]: increment(count),
      });

      return true;
    } catch (error) {
      console.error(`Error tracking ${type} usage:`, error);
      throw error;
    }
  }

  async checkUsage(userId: string, type: 'email' | 'sms' | 'lead'): Promise<{
    used: number;
    total: number;
    remaining: number;
  }> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const usageField = `used${type.charAt(0).toUpperCase() + type.slice(1)}s`;
      const totalField = `total${type.charAt(0).toUpperCase() + type.slice(1)}s`;

      return {
        used: userData[usageField] || 0,
        total: userData[totalField] || 0,
        remaining: (userData[totalField] || 0) - (userData[usageField] || 0),
      };
    } catch (error) {
      console.error(`Error checking ${type} usage:`, error);
      throw error;
    }
  }
}

export const apiUsageService = new ApiUsageService(); 