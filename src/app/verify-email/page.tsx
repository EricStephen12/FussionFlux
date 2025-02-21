'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailVerificationService } from '@/services/email-verification';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const oobCode = searchParams.get('oobCode');
        if (!oobCode) {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        await EmailVerificationService.verifyEmailToken(oobCode);
        setStatus('success');
        
        // Redirect to onboarding after 3 seconds
        setTimeout(() => {
          router.push('/onboarding');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Failed to verify email');
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. Redirecting you to complete your profile...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailVerificationService } from '@/services/email-verification';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const oobCode = searchParams.get('oobCode');
        if (!oobCode) {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        await EmailVerificationService.verifyEmailToken(oobCode);
        setStatus('success');
        
        // Redirect to onboarding after 3 seconds
        setTimeout(() => {
          router.push('/onboarding');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Failed to verify email');
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verifying your email...
            </h2>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Email Verified!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your email has been successfully verified. Redirecting you to complete your profile...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 