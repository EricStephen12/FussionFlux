import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';
import React from 'react';
import * as Sentry from "@sentry/react";


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
  description: 'Powerful email marketing platform for dropshippers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans h-full`}>
      <body className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <ClientLayout>
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </ClientLayout>
      </body>
    </html>
  );
} 