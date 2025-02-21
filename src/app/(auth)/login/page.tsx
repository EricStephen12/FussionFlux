'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSVG from '../../../../public/google.svg';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, user, isNewUser, hasCompletedOnboarding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If user is already logged in, handle redirection
    if (user) {
      const handleRedirect = async () => {
        try {
          // If it's a new user or onboarding is not completed, redirect to onboarding
          if (isNewUser || !hasCompletedOnboarding) {
            router.push('/onboarding');
            return;
          }

          // Otherwise, redirect to the requested page or dashboard
          const redirectPath = searchParams.get('redirect') || '/dashboard';
          router.push(redirectPath);
        } catch (error) {
          console.error('Redirect error:', error);
          setError('Failed to redirect after login');
        }
      };

      handleRedirect();
    }
  }, [user, isNewUser, hasCompletedOnboarding, router, searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      // Redirect will happen in useEffect
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to FussionFlux
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your Google account to get started
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm border-gray-300 space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              src={GoogleSVG}
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <a href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 