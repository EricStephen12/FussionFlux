import { db } from '@/firebase/config';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  setDoc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  addDoc
} from 'firebase/firestore';

// Define credit type constants
export const CREDIT_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  LEAD: 'lead'
};

// Interface for credit information
export interface CreditInfo {
  available: {
    emails: number;
    sms: number;
    leads: number;
  };
  used: {
    emails: number;
    sms: number;
    leads: number;
  };
  subscription: {
    maxEmails: number;
    maxSms: number;
    maxLeads: number;
  };
  extra: {
    emails: number;
    sms: number;
    leads: number;
  };
}

// Interface for credit check result
export interface CreditCheckResult {
  sufficient: {
    emails: boolean;
    sms: boolean;
    leads: boolean;
    all: boolean;
  };
  required: {
    emails: number;
    sms: number;
    leads: number;
  };
  available: {
    emails: number;
    sms: number;
    leads: number;
  };
}

// Credit service for managing all credit-related operations
export const CreditService = {
  /**
   * Get available credits for a user
   * @param userId The user ID
   * @returns Object containing available credits
   */
  async getAvailableCredits(userId: string): Promise<CreditInfo['available']> {
    try {
      // Get user credits document
      const userCreditsDoc = await getDoc(doc(db, 'userCredits', userId));
      
      // Get user subscription document
      const userSubscriptionDoc = await getDoc(doc(db, 'userSubscriptions', userId));
      
      // Default values if documents don't exist
      const defaultCredits = { emails: 0, sms: 0, leads: 0 };
      
      if (!userCreditsDoc.exists() || !userSubscriptionDoc.exists()) {
        return defaultCredits;
      }
      
      const creditsData = userCreditsDoc.data();
      const subscriptionData = userSubscriptionDoc.data();
      
      // Calculate available credits based on subscription limits and extra credits
      const availableEmails = (subscriptionData.tier?.maxEmails || 0) - (creditsData.used?.emails || 0) + (creditsData.extra?.emails || 0);
      const availableSms = (subscriptionData.tier?.maxSms || 0) - (creditsData.used?.sms || 0) + (creditsData.extra?.sms || 0);
      const availableLeads = (subscriptionData.tier?.maxLeads || 0) - (creditsData.used?.leads || 0) + (creditsData.extra?.leads || 0);
      
      return {
        emails: Math.max(0, availableEmails),
        sms: Math.max(0, availableSms),
        leads: Math.max(0, availableLeads)
      };
    } catch (error) {
      console.error('Error getting available credits:', error);
      return { emails: 0, sms: 0, leads: 0 };
    }
  },
  
  /**
   * Check if a user has sufficient credits for an operation
   * @param userId The user ID
   * @param emailsRequired Number of email credits required
   * @param smsRequired Number of SMS credits required
   * @param leadsRequired Number of lead credits required
   * @returns Whether the user has sufficient credits
   */
  async checkSufficientCredits(
    userId: string,
    emailsRequired: number = 0,
    smsRequired: number = 0,
    leadsRequired: number = 0
  ): Promise<CreditCheckResult> {
    try {
      const availableCredits = await this.getAvailableCredits(userId);
      
      // Check if each credit type is sufficient
      const sufficientEmails = availableCredits.emails >= emailsRequired;
      const sufficientSms = availableCredits.sms >= smsRequired;
      const sufficientLeads = availableCredits.leads >= leadsRequired;
      
      // All credit types must be sufficient
      const allSufficient = sufficientEmails && sufficientSms && sufficientLeads;
      
      return {
        sufficient: {
          emails: sufficientEmails,
          sms: sufficientSms,
          leads: sufficientLeads,
          all: allSufficient
        },
        required: {
          emails: emailsRequired,
          sms: smsRequired,
          leads: leadsRequired
        },
        available: availableCredits
      };
    } catch (error) {
      console.error('Error checking sufficient credits:', error);
      return {
        sufficient: {
          emails: false,
          sms: false,
          leads: false,
          all: false
        },
        required: {
          emails: emailsRequired,
          sms: smsRequired,
          leads: leadsRequired
        },
        available: { emails: 0, sms: 0, leads: 0 }
      };
    }
  },
  
  /**
   * Use credits for an operation
   * @param userId The user ID
   * @param emailsToUse Number of email credits to use
   * @param smsToUse Number of SMS credits to use
   * @param leadsToUse Number of lead credits to use
   * @param metadata Additional metadata for the credit usage
   * @returns Whether the credits were successfully used
   */
  async useCredits(
    userId: string,
    emailsToUse: number = 0,
    smsToUse: number = 0,
    leadsToUse: number = 0,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      // Check if user has sufficient credits
      const creditCheck = await this.checkSufficientCredits(
        userId,
        emailsToUse,
        smsToUse,
        leadsToUse
      );
      
      if (!creditCheck.sufficient.all) {
        console.error('Insufficient credits for operation');
        return false;
      }
      
      // Use Firestore transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        const userCreditsRef = doc(db, 'userCredits', userId);
        const userCreditsDoc = await transaction.get(userCreditsRef);
        
        // Create default document if it doesn't exist
        if (!userCreditsDoc.exists()) {
          transaction.set(userCreditsRef, {
            used: {
              emails: 0,
              sms: 0,
              leads: 0
            },
            extra: {
              emails: 0,
              sms: 0,
              leads: 0
            }
          });
        }
        
        // Update the used credits
        transaction.update(userCreditsRef, {
          'used.emails': increment(emailsToUse),
          'used.sms': increment(smsToUse),
          'used.leads': increment(leadsToUse)
        });
        
        // Log credit usage
        const creditLogRef = collection(db, 'creditLogs');
        transaction.set(doc(creditLogRef), {
          userId,
          timestamp: Timestamp.now(),
          credits: {
            emails: emailsToUse,
            sms: smsToUse,
            leads: leadsToUse
          },
          metadata,
          type: 'use'
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      return false;
    }
  },
  
  /**
   * Add extra credits to a user's account
   * @param userId The user ID
   * @param emailsToAdd Number of email credits to add
   * @param smsToAdd Number of SMS credits to add
   * @param leadsToAdd Number of lead credits to add
   * @param metadata Additional metadata for the credit addition
   * @returns Whether the credits were successfully added
   */
  async addExtraCredits(
    userId: string,
    emailsToAdd: number = 0,
    smsToAdd: number = 0,
    leadsToAdd: number = 0,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      // Use Firestore transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        const userCreditsRef = doc(db, 'userCredits', userId);
        const userCreditsDoc = await transaction.get(userCreditsRef);
        
        // Create default document if it doesn't exist
        if (!userCreditsDoc.exists()) {
          transaction.set(userCreditsRef, {
            used: {
              emails: 0,
              sms: 0,
              leads: 0
            },
            extra: {
              emails: 0,
              sms: 0,
              leads: 0
            }
          });
        }
        
        // Update the extra credits
        transaction.update(userCreditsRef, {
          'extra.emails': increment(emailsToAdd),
          'extra.sms': increment(smsToAdd),
          'extra.leads': increment(leadsToAdd)
        });
        
        // Log credit addition
        const creditLogRef = collection(db, 'creditLogs');
        transaction.set(doc(creditLogRef), {
          userId,
          timestamp: Timestamp.now(),
          credits: {
            emails: emailsToAdd,
            sms: smsToAdd,
            leads: leadsToAdd
          },
          metadata,
          type: 'add'
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error adding extra credits:', error);
      return false;
    }
  },
  
  /**
   * Reset used credits (typically done when subscription renews)
   * @param userId The user ID
   * @returns Whether the credits were successfully reset
   */
  async resetUsedCredits(userId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'userCredits', userId), {
        'used.emails': 0,
        'used.sms': 0,
        'used.leads': 0
      });
      
      // Log credit reset
      await addDoc(collection(db, 'creditLogs'), {
        userId,
        timestamp: Timestamp.now(),
        type: 'reset'
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting used credits:', error);
      return false;
    }
  },
  
  /**
   * Get credit usage history for a user
   * @param userId The user ID
   * @param limit Maximum number of records to return
   * @returns Array of credit usage records
   */
  async getCreditHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const creditLogsRef = collection(db, 'creditLogs');
      const q = query(
        creditLogsRef, 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const logs: any[] = [];
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by timestamp descending (newest first)
      logs.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      
      // Limit the results
      return logs.slice(0, limit);
    } catch (error) {
      console.error('Error getting credit history:', error);
      return [];
    }
  }
}; 