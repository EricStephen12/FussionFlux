import { NextResponse } from "next/server";
import * as Sentry from '@sentry/nextjs';

export const dynamic = "force-dynamic";

// A faulty API route to test Sentry's error monitoring
export async function GET() {
  try {
    // Start a new Sentry transaction
    const transaction = Sentry.startTransaction({
      name: 'Example API Transaction',
      op: 'test',
    });

    // Simulate an API error
    const error = new Error('Sentry Example API Error');
    error.name = 'SentryDemoError';
    throw error;

    // This code will never be reached
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    // Report error to Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        api: 'sentry-example-api',
        method: 'GET',
        type: 'demo_error'
      },
      extra: {
        message: 'This error was intentionally triggered for demonstration purposes'
      }
    });

    // Return error response with more context
    return NextResponse.json(
      {
        error: 'This is a demonstration error for Sentry tracking',
        details: 'Check your Sentry dashboard to see how this error was captured and reported.',
        type: 'demo_error'
      },
      { status: 500 }
    );
  } finally {
    // Finish the transaction
    if (Sentry.getCurrentHub().getScope()?.getTransaction()) {
      Sentry.getCurrentHub().getScope()?.getTransaction()?.finish();
    }
  }
}
