interface ErrorDetails {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  method?: string;
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  initialize() {
    if (this.isInitialized) return;

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.logError({
          message: message.toString(),
          stack: error?.stack,
          context: {
            source,
            lineno,
            colno,
          },
        });
      };

      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          context: {
            reason: event.reason,
          },
        });
      });
    }

    this.isInitialized = true;
  }

  async logError(details: ErrorDetails) {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error:', details.message);
        if (details.stack) console.error(details.stack);
        if (details.context) console.error('Context:', details.context);
        return;
      }

      // In production, send to your error tracking service
      // Here you would typically send to services like Sentry, LogRocket, etc.
      const errorData = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        ...details,
      };

      // Example: Send to your error tracking endpoint
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (error) {
      // Fallback error logging
      console.error('Failed to log error:', error);
      console.error('Original error:', details);
    }
  }

  async logApiError(error: any, req: Request) {
    const url = new URL(req.url);
    
    await this.logError({
      message: error.message || 'API Error',
      stack: error.stack,
      context: {
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        method: req.method,
        headers: Object.fromEntries(req.headers),
      },
    });
  }

  // Helper method to wrap API handlers with error monitoring
  wrapApiHandler(handler: Function) {
    return async (req: Request) => {
      try {
        return await handler(req);
      } catch (error: any) {
        await this.logApiError(error, req);
        throw error; // Re-throw to be handled by the API route
      }
    };
  }
}

export const errorMonitor = ErrorMonitor.getInstance();
export type { ErrorDetails }; 