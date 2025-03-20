"use client";

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryExamplePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTestError = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const res = await fetch('/api/sentry-example-api');
      const data = await res.json();
      
      if (!res.ok) {
        // This is the expected behavior - we want to demonstrate error reporting
        setSuccess(true);
        throw new Error(data.error || 'Sentry Example Frontend Error');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      
      // Report error to Sentry
      Sentry.captureException(error, {
        tags: {
          page: 'sentry-example-page',
          action: 'test-error'
        }
      });

      // Since this is a demo, we'll show a success message after reporting the error
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Sentry Example Page
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Test Sentry error reporting functionality
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Test Error Reporting
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Click the button below to simulate an error and see how Sentry captures it.
                  This will intentionally trigger a 500 error to demonstrate error tracking.
                </p>
              </div>
              <div className="mt-5">
                <button
                  onClick={handleTestError}
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {loading ? 'Testing...' : 'Test Error'}
                </button>
              </div>
            </div>
          </div>

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    Error was successfully captured and reported to Sentry.
                    Check your Sentry dashboard to see the error details.
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Expected Error</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    {error}
                    <p className="mt-1">
                      This error was intentionally triggered to demonstrate Sentry's error tracking.
                      Check your Sentry dashboard to see the captured error.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
