// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSVG from '../../../../public/google.svg';
import { logger } from '@/utils/logger';
import { 
  ArrowRightIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for success message from URL
    const successMsg = searchParams?.get('success');
    if (successMsg) {
      setSuccess(decodeURIComponent(successMsg));
    }
    
    // If user is already logged in, redirect to dashboard or requested page
    if (user && !isRedirecting) {
      const redirectPath = searchParams?.get('redirect') || '/dashboard';
      console.log('User authenticated in login page, redirecting to:', redirectPath);
      setIsRedirecting(true);
      router.push(redirectPath);
    }
  }, [user, router, searchParams, isRedirecting]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      console.log('Initiating Google sign-in...');
      const result = await signInWithGoogle();
      console.log('Google sign-in successful, user will be redirected via useEffect');
      
      // Show success message while redirecting
      setSuccess('Sign-in successful! Redirecting...');
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show user-friendly error message
      if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site or try another sign-in method.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(error.message || 'Failed to sign in. Please try again.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Decorative */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 p-12 text-white flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold">FussionFlux</h1>
          <p className="mt-2 text-indigo-100">Email marketing for dropshippers</p>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-2">Drive More Sales</h2>
            <p className="text-indigo-100">
              Our email marketing platform is specifically designed to help dropshippers increase conversions and grow their business.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-indigo-300 mr-2 flex-shrink-0" />
              <p>Specialized templates for product promotion</p>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-indigo-300 mr-2 flex-shrink-0" />
              <p>Directly track revenue from campaigns</p>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-6 w-6 text-indigo-300 mr-2 flex-shrink-0" />
              <p>Automated campaigns that convert</p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-indigo-200">
          © {new Date().getFullYear()} FussionFlux. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile logo - only shown on small screens */}
          <div className="md:hidden text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FussionFlux
            </h1>
            <p className="mt-1 text-gray-500">Email marketing for dropshippers</p>
          </div>
          
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || isRedirecting}
              className="group relative w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                  <Image
                    src={GoogleSVG}
                    alt="Google logo"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                )}
              </div>
              <span>
                {loading ? 'Signing in...' : 
                 isRedirecting ? 'Redirecting...' : 
                 'Continue with Google'}
              </span>
            </button>
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with email (coming soon)</span>
              </div>
            </div>
            
            {/* Email login form placeholder - to be implemented later */}
            <div className="mt-6 space-y-4 opacity-50 pointer-events-none">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    disabled
                    className="pl-10 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    disabled
                    className="pl-10 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <button
                disabled
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm">
              <Link href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm">
              <Link href="/signup" className="font-medium flex items-center text-indigo-600 hover:text-indigo-500">
                Create account <ArrowRightIcon className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="pt-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 