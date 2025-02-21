'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import Navigation from './Navigation';
import ErrorBoundary from './ErrorBoundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <ErrorBoundary>
          <Navigation>{children}</Navigation>
        </ErrorBoundary>
      </OnboardingProvider>
    </AuthProvider>
  );
} 