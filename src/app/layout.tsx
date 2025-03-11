import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';
import React from 'react';
import * as Sentry from "@sentry/react";
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';


const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",  // Replace with your actual DSN
  tracesSampleRate: 1.0,
});

export const metadata = {
  title: 'Dropship Email Platform',
  description: 'Powerful email marketing platform for dropshippers - Automate your email campaigns, increase sales, and grow your business.',
  keywords: 'dropshipping, email marketing, automation, ecommerce, marketing platform',
  authors: [{ name: 'Your Company Name' }],
  creator: 'Your Company Name',
  publisher: 'Your Company Name',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Dropship Email Platform',
    description: 'Powerful email marketing platform for dropshippers - Automate your email campaigns, increase sales, and grow your business.',
    url: 'https://your-domain.com',
    siteName: 'Dropship Email Platform',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dropship Email Platform',
    description: 'Powerful email marketing platform for dropshippers - Automate your email campaigns, increase sales, and grow your business.',
    creator: '@yourhandle',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://your-domain.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans h-full`}>
      <body className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <AuthProvider>
          <SubscriptionProvider>
            <ClientLayout>
              <main className="min-h-screen flex flex-col">
                {children}
              </main>
            </ClientLayout>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 