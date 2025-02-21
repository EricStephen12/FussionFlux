// This file configures the initialization of Sentry on the client side.
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample rate for all sessions (10%)
  replaysOnErrorSampleRate: 1.0, // Sample rate for sessions with errors (100%)

  // Enable automatic instrumentation of Next.js routing
  integrations: [new Sentry.BrowserTracing()],
}); 