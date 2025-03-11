import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const withAuth = (WrappedComponent: React.ComponentType) => {
  return (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    // If loading, show a loading state
    if (loading) return <div>Loading...</div>;

    // If user is not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return null;
    }

    // If authenticated, render the wrapped component
    return <WrappedComponent {...props} />;
  };
};

export default withAuth; 