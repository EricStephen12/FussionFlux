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
  GiftIcon,
  StarIcon,
  BoltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function SignupPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get('ref');

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      console.log('User authenticated in signup page, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      
      console.log('Initiating Google sign-in with referral code:', referralCode);
      const result = await signInWithGoogle(referralCode);
      console.log('Google sign-in successful, user will be redirected via useEffect');
      
      // No need to redirect here - it will happen in useEffect when user state changes
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Show user-friendly error message
      if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site or try another sign-in method.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError(error.message || 'Failed to sign up. Please try again.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
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
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {referralCode ? (
                "You've been invited! Sign up to get started with extra credits."
              ) : (
                "Start your journey to better email marketing"
              )}
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Image
                  src={GoogleSVG}
                  alt="Google logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
              <span>{loading ? 'Creating account...' : 'Continue with Google'}</span>
            </button>
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or create account with email (coming soon)</span>
              </div>
            </div>
          </div>

          {/* Benefits section - Highlighted more prominently for referrals */}
          {referralCode ? (
            <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 flex items-center">
                <GiftIcon className="h-5 w-5 mr-1.5 text-indigo-600" />
                Your special referral benefits:
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start text-sm">
                  <div className="flex-shrink-0 h-5 w-5 text-indigo-500 flex items-center justify-center rounded-full bg-indigo-100">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="ml-2 text-indigo-700">
                    <span className="font-semibold">500 Email Credits</span> - Send more campaigns
                  </p>
                </li>
                <li className="flex items-start text-sm">
                  <div className="flex-shrink-0 h-5 w-5 text-indigo-500 flex items-center justify-center rounded-full bg-indigo-100">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="ml-2 text-indigo-700">
                    <span className="font-semibold">100 SMS Credits</span> - Reach customers directly
                  </p>
                </li>
                <li className="flex items-start text-sm">
                  <div className="flex-shrink-0 h-5 w-5 text-indigo-500 flex items-center justify-center rounded-full bg-indigo-100">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="ml-2 text-indigo-700">
                    <span className="font-semibold">Extended Trial</span> - 14-day full access
                  </p>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                What you'll get:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span>Access to all essential email marketing tools</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span>Dropshipping-specific email templates</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span>14-day free trial of all features</span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm">
              <Link href="/login" className="font-medium flex items-center text-indigo-600 hover:text-indigo-500">
                <ArrowLeftIcon className="mr-1 h-3 w-3" /> Back to login
              </Link>
            </div>
          </div>

          <div className="pt-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
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
      
      {/* Right side - Decorative */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-600 to-indigo-600 p-12 text-white flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold">FussionFlux</h1>
          <p className="mt-2 text-purple-100">Grow your dropshipping business</p>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3">Why FussionFlux?</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <StarIcon className="h-6 w-6 text-yellow-300" />
                </div>
                <div className="ml-3">
                  <h3 className="text-base font-medium text-white">Specialized for Dropshipping</h3>
                  <p className="mt-1 text-sm text-purple-100">
                    Templates and tools specifically designed for product promotion and order updates.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-6 w-6 text-yellow-300" />
                </div>
                <div className="ml-3">
                  <h3 className="text-base font-medium text-white">Advanced Automation</h3>
                  <p className="mt-1 text-sm text-purple-100">
                    Set up automated campaigns that trigger based on customer behavior and purchasing patterns.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0">
                  <GiftIcon className="h-6 w-6 text-yellow-300" />
                </div>
                <div className="ml-3">
                  <h3 className="text-base font-medium text-white">Free Trial</h3>
                  <p className="mt-1 text-sm text-purple-100">
                    Start with a free trial that includes everything you need to test our platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-purple-200">
          © {new Date().getFullYear()} FussionFlux. All rights reserved.
        </div>
      </div>
    </div>
  );
} 