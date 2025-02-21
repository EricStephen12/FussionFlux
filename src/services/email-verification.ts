import { auth } from '@/utils/firebase';

export class EmailVerificationService {
  static async sendVerificationEmail(email: string, displayName: string) {
    try {
      // First check if we have a current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Make the API call to send verification email
      const response = await fetch('/api/email/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      return data;
    } catch (error: any) {
      console.error('Error in sendVerificationEmail:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }
  }

  static async verifyEmailToken(oobCode: string) {
    try {
      // Verify the action code/oobCode
      await auth.applyActionCode(oobCode);
      
      // Force refresh the user's token to get updated email verification status
      await auth.currentUser?.reload();
      
      return true;
    } catch (error: any) {
      console.error('Error verifying email:', error);
      throw new Error(error.message || 'Failed to verify email');
    }
  }

  static async checkEmailVerificationStatus() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Force refresh the user to get the latest status
      await currentUser.reload();
      
      return currentUser.emailVerified;
    } catch (error: any) {
      console.error('Error checking email verification status:', error);
      throw new Error(error.message || 'Failed to check email verification status');
    }
  }
} 