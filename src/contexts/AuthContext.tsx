'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { db } from '@/utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  isNewUser: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isNewUser: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Set up authentication state observer
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        if (currentUser) {
          // Check if user needs onboarding whenever auth state changes
          const isNew = await checkUserOnboarding(currentUser.uid);
          setIsNewUser(isNew);
          
          // Get the ID token and set it as a cookie
          const idToken = await currentUser.getIdToken();
          document.cookie = `session=${idToken}; path=/; max-age=3600; SameSite=Lax`;
          
          setUser(currentUser);
        } else {
          // Clear the session cookie when user is not authenticated
          document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          setUser(null);
          setIsNewUser(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkUserOnboarding = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user - create initial user document with onboarding status
        await setDoc(userDocRef, {
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName,
          photoURL: auth.currentUser?.photoURL,
          createdAt: new Date(),
          onboarding: {
            completed: false,
            currentStep: 0,
            steps: [
              {
                id: 'profile',
                title: 'Complete Your Profile',
                description: 'Add your business details and preferences',
                completed: false,
              },
              {
                id: 'verify-email',
                title: 'Verify Email',
                description: 'Verify your email address',
                completed: auth.currentUser?.emailVerified || false,
              },
              {
                id: 'select-niche',
                title: 'Select Your Niche',
                description: 'Choose your target market and industry',
                completed: false,
              }
            ]
          },
          settings: {
            emailNotifications: true,
            marketingEmails: true
          },
          lastLoginAt: new Date()
        });
        return true;
      }

      // Existing user - update last login
      await setDoc(userDocRef, { lastLoginAt: new Date() }, { merge: true });
      return false;
    } catch (error) {
      console.error('Error checking user onboarding:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Wait for the onboarding check to complete
        const isNew = await checkUserOnboarding(result.user.uid);
        setIsNewUser(isNew);
        
        // Set the session cookie
        const idToken = await result.user.getIdToken();
        document.cookie = `session=${idToken}; path=/; max-age=3600; SameSite=Lax`;
        
        return result;
      }
    } catch (error: any) {
      console.error('Google Sign-in Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await auth.signOut();
      // Clear the session cookie
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      setUser(null);
      setIsNewUser(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Don't render children until auth is initialized
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isNewUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const defaultOnboardingSteps = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'Complete your business profile',
    completed: false
  },
  {
    id: 'verify-email',
    title: 'Verify Email',
    description: 'Verify your email address',
    completed: false
  },
  {
    id: 'select-niche',
    title: 'Select Your Niche',
    description: 'Choose your target market and industry',
    completed: false
  }
]; 