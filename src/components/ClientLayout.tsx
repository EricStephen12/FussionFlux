'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from './Navigation';
import ErrorBoundary from './ErrorBoundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Navigation>{children}</Navigation>
      </ErrorBoundary>
    </AuthProvider>
  );
} 