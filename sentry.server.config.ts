// This file configures the initialization of Sentry on the server side.
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // Enable automatic instrumentation of Next.js routing and API
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
}); 