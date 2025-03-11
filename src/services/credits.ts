import { db } from '@/utils/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

interface ExtraCredits {
  quantity: number;
  expiresAt: string;
  purchasedAt: string;
}

interface UserCredits {
  extraEmails: ExtraCredits[];
  extraSMS: ExtraCredits[];
  extraLeads: ExtraCredits[];
}

export const creditsService = {
  async addExtraCredits(userId: string, type: 'emails' | 'sms' | 'leads', quantity: number) {
    const userRef = doc(db, 'users', userId);
    const userData = await getDoc(userRef);
    
    if (!userData.exists()) {
      throw new Error('User not found');
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const newCredit: ExtraCredits = {
      quantity,
      expiresAt,
      purchasedAt: new Date().toISOString()
    };

    const credits = userData.data().extraCredits || {};
    const extraCreditsArray = credits[`extra${type.charAt(0).toUpperCase() + type.slice(1)}`] || [];
    
    await updateDoc(userRef, {
      [`extraCredits.extra${type.charAt(0).toUpperCase() + type.slice(1)}`]: [
        ...extraCreditsArray,
        newCredit
      ]
    });

    return true;
  },

  async getAvailableExtraCredits(userId: string, type: 'emails' | 'sms' | 'leads'): Promise<number> {
    const userRef = doc(db, 'users', userId);
    const userData = await getDoc(userRef);
    
    if (!userData.exists()) {
      return 0;
    }

    const credits = userData.data().extraCredits || {};
    const extraCreditsArray = credits[`extra${type.charAt(0).toUpperCase() + type.slice(1)}`] || [];
    
    const now = new Date();
    const validCredits = extraCreditsArray.filter((credit: ExtraCredits) => 
      new Date(credit.expiresAt) > now
    );

    return validCredits.reduce((total: number, credit: ExtraCredits) => total + credit.quantity, 0);
  },

  async useExtraCredits(userId: string, type: 'emails' | 'sms' | 'leads', quantity: number): Promise<boolean> {
    const availableCredits = await this.getAvailableExtraCredits(userId, type);
    
    if (availableCredits < quantity) {
      return false;
    }

    const userRef = doc(db, 'users', userId);
    const userData = await getDoc(userRef);
    
    if (!userData.exists()) {
      return false;
    }

    const credits = userData.data().extraCredits || {};
    const extraCreditsArray = credits[`extra${type.charAt(0).toUpperCase() + type.slice(1)}`] || [];
    
    const now = new Date();
    let remainingQuantity = quantity;
    const updatedCredits = extraCreditsArray
      .filter((credit: ExtraCredits) => new Date(credit.expiresAt) > now)
      .map((credit: ExtraCredits) => {
        if (remainingQuantity <= 0) return credit;
        
        if (credit.quantity <= remainingQuantity) {
          remainingQuantity -= credit.quantity;
          return { ...credit, quantity: 0 };
        } else {
          credit.quantity -= remainingQuantity;
          remainingQuantity = 0;
          return credit;
        }
      })
      .filter((credit: ExtraCredits) => credit.quantity > 0);

    await updateDoc(userRef, {
      [`extraCredits.extra${type.charAt(0).toUpperCase() + type.slice(1)}`]: updatedCredits
    });

    return true;
  }
}; 