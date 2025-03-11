import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export interface UserSettings {
  emailNotifications: boolean;
  marketingEmails: boolean;
}

export class SettingsService {
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (!userData?.settings) {
        // Default settings if none exist
        const defaultSettings: UserSettings = {
          emailNotifications: true,
          marketingEmails: true,
        };
        await this.updateUserSettings(userId, defaultSettings);
        return defaultSettings;
      }
      
      return userData.settings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw new Error('Failed to get user settings');
    }
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, settings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }
  }
}

export const settingsService = new SettingsService(); 