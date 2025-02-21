'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '@/services/firestore';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface OnboardingContextType {
  steps: OnboardingStep[];
  currentStep: number;
  completeStep: (stepId: string) => Promise<void>;
  isOnboardingComplete: boolean;
  skipOnboarding: () => Promise<void>;
  updateOnboardingState: (data: { currentStep: number; steps: OnboardingStep[] }) => Promise<void>;
}

export const defaultSteps = [
  {
    id: 'profile',
    title: 'Complete Profile',
    description: 'Tell us about your business',
    completed: false,
  },
  {
    id: 'verify-email',
    title: 'Verify Email',
    description: 'Verify your email address',
    completed: false,
  },
  {
    id: 'select-niche',
    title: 'Select Your Niche',
    description: 'Choose your target market',
    completed: false,
  }
];

const OnboardingContext = createContext<OnboardingContextType>({
  steps: defaultSteps,
  currentStep: 0,
  completeStep: async () => {},
  isOnboardingComplete: false,
  skipOnboarding: async () => {},
  updateOnboardingState: async () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOnboardingState();
    } else {
      setSteps(defaultSteps);
      setCurrentStep(0);
    }
  }, [user]);

  const loadOnboardingState = async () => {
    if (!user) return;
    
    try {
      const userDoc = await firestoreService.getUserDocument(user.uid);
      if (userDoc?.onboarding?.steps && Array.isArray(userDoc.onboarding.steps)) {
        setSteps(userDoc.onboarding.steps);
        setCurrentStep(userDoc.onboarding.currentStep || 0);
      } else {
        setSteps(defaultSteps);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
      setSteps(defaultSteps);
      setCurrentStep(0);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!user) return;

    try {
      const currentSteps = Array.isArray(steps) ? steps : defaultSteps;
      const updatedSteps = currentSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      );
      
      const nextStep = currentStep + 1;
      const allStepsCompleted = updatedSteps.every((step) => step.completed);
      
      await firestoreService.updateUserDocument(user.uid, {
        onboarding: {
          steps: updatedSteps,
          currentStep: nextStep,
          completed: allStepsCompleted
        },
      });

      setSteps(updatedSteps);
      setCurrentStep(nextStep);
    } catch (error) {
      console.error('Error completing onboarding step:', error);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;

    try {
      const currentSteps = Array.isArray(steps) ? steps : defaultSteps;
      const completedSteps = currentSteps.map((step) => ({
        ...step,
        completed: true,
      }));

      await firestoreService.updateUserDocument(user.uid, {
        onboarding: {
          steps: completedSteps,
          currentStep: completedSteps.length,
          completed: true,
        },
      });

      setSteps(completedSteps);
      setCurrentStep(completedSteps.length);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const isOnboardingComplete = Array.isArray(steps) ? steps.every((step) => step.completed) : false;

  const updateOnboardingState = async (data: { currentStep: number; steps: OnboardingStep[] }) => {
    if (!user) return;

    try {
      const validSteps = Array.isArray(data.steps) ? data.steps : defaultSteps;
      await firestoreService.updateUserDocument(user.uid, {
        onboarding: {
          steps: validSteps,
          currentStep: data.currentStep || 0,
          completed: validSteps.every(step => step.completed)
        },
      });

      setSteps(validSteps);
      setCurrentStep(data.currentStep || 0);
    } catch (error) {
      console.error('Error updating onboarding state:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        steps: Array.isArray(steps) ? steps : defaultSteps,
        currentStep,
        completeStep,
        isOnboardingComplete,
        skipOnboarding,
        updateOnboardingState,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 