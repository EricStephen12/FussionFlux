'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { subscriberService } from '@/services/subscriber';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your unsubscribe request...');

  useEffect(() => {
    const handleUnsubscribe = async () => {
      try {
        const email = searchParams.get('email');
        const token = searchParams.get('t');
        const campaignId = searchParams.get('c');

        if (!email || !token) {
          setStatus('error');
          setMessage('Invalid unsubscribe request. Please try again or contact support.');
          return;
        }

        // Validate the token
        if (!subscriberService.validateUnsubscribeToken(email, token)) {
          setStatus('error');
          setMessage('Invalid or expired unsubscribe link. Please try again or contact support.');
          return;
        }

        // Process unsubscribe
        const success = await subscriberService.unsubscribe(
          email,
          user?.uid || '',
          campaignId || undefined
        );

        if (success) {
          setStatus('success');
          setMessage('You have been successfully unsubscribed from our emails.');
        } else {
          setStatus('error');
          setMessage('Unable to process unsubscribe request. Please try again or contact support.');
        }
      } catch (error) {
        console.error('Error processing unsubscribe:', error);
        setStatus('error');
        setMessage('An error occurred while processing your request. Please try again or contact support.');
      }
    };

    handleUnsubscribe();
  }, [searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Unsubscribe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        {status === 'loading' && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/contact'}
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
} 