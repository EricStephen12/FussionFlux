'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BoltIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navigation({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if current route is a protected route
  const isProtectedRoute = pathname && (pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/settings') || 
                          pathname.startsWith('/campaigns') || 
                          pathname.startsWith('/analytics'));

  return (
    <>
      {/* Global Header - Always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always visible */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <BoltIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  FussionFlux
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              <Link href="/features" className="nav-link text-sm lg:text-base">Features</Link>
              <Link href="/pricing" className="nav-link text-sm lg:text-base">Pricing</Link>
              <Link href="/contact" className="nav-link text-sm lg:text-base">Contact</Link>
              <Link href="/privacy" className="nav-link text-sm lg:text-base">Privacy Policy</Link>
              {user && isProtectedRoute ? (
                <>
                  <Link href="/dashboard" className="nav-link text-sm lg:text-base">Dashboard</Link>
                  <button 
                    onClick={handleSignOut}
                    className="btn-secondary !py-2 !px-4 text-sm lg:text-base"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="btn-primary !py-2 !px-4 text-sm lg:text-base">
                  Get Started
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 p-2 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - Slides down below header */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="bg-white border-t border-gray-200 py-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
              <Link
                href="/features"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Privacy Policy
              </Link>
              {user && isProtectedRoute ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 mx-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-16">
        {children}
      </div>
    </>
  );
} 