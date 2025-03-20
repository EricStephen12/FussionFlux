import '@/utils/polyfills';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import React from 'react';
import * as Sentry from "@sentry/react";
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import './globals.css';

// Dynamically import the ClientLayout component
const ClientLayout = dynamic(() => import('@/components/ClientLayout'), {
  ssr: true,
  loading: () => <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" />
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Optimize font loading
});

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fussionflux.com'),
  title: {
    default: 'Fussion Flux - Email Marketing for E-commerce Success',
    template: '%s | Fussion Flux'
  },
  description: 'Professional email marketing platform designed specifically for dropshippers and e-commerce businesses. Automate campaigns, increase conversions, and grow your business with our powerful tools.',
  keywords: [
    'email marketing',
    'ecommerce automation',
    'dropshipping tools',
    'shopify email marketing',
    'e-commerce automation',
    'sms marketing',
    'lead generation',
    'marketing automation',
    'sales funnels',
    'e-commerce business'
  ],
  authors: [{ name: 'Fussion Flux', url: 'https://fussionflux.com' }],
  creator: 'Fussion Flux',
  publisher: 'Fussion Flux',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Fussion Flux - Email Marketing for E-commerce Success',
    description: 'Professional email marketing platform designed specifically for dropshippers and e-commerce businesses. Automate campaigns, increase conversions, and grow your business with our powerful tools.',
    url: 'https://fussionflux.com',
    siteName: 'Fussion Flux',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://fussionflux.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fussion Flux - Email Marketing for E-commerce Success'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fussion Flux - Email Marketing for E-commerce',
    description: 'Professional email marketing platform designed specifically for dropshippers and e-commerce businesses. Automate campaigns, increase conversions, and grow your business.',
    creator: '@fussionflux',
    site: '@fussionflux',
    images: ['https://fussionflux.com/twitter-image.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: 'https://fussionflux.com',
    languages: {
      'en-US': 'https://fussionflux.com',
    },
  },
  category: 'technology',
  applicationName: 'Fussion Flux',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black',
    'apple-mobile-web-app-title': 'Fussion Flux',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans h-full`}>
      <head>
        <link rel="icon" href="/fussion-flux-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#4f46e5" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
        <meta name="theme-color" content="#ffffff" />
      </head>
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