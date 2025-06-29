'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/Button';
import { SignOutButton } from '@/components/auth';
import { UserMenu } from '@/components/layout';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loading = authLoading || profileLoading;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 transition-colors hover:text-gray-700"
              >
                Currents
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/about"
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                >
                  About
                </Link>
              </nav>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div
                  className="h-9 w-20 animate-pulse rounded-md bg-gray-200"
                  data-testid="loading-skeleton"
                />
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/write">
                    <Button variant="primary" size="sm">
                      Create Post
                    </Button>
                  </Link>
                  <UserMenu />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/sign-in">
                    <Button variant="secondary" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button variant="primary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 -mr-2 touch-target rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-white"
          style={{ top: '64px' }}
        >
          <nav className="h-full overflow-y-auto safe-bottom">
            <div className="px-4 py-6 space-y-1">
              <Link
                href="/about"
                className="block px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
            </div>

            {/* Mobile Auth Section */}
            <div className="px-4 py-6 border-t border-gray-200">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
                  <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
                </div>
              ) : user ? (
                <div className="space-y-1">
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Signed in as {user.email}
                  </div>
                  <Link
                    href="/write"
                    className="block px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Post
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={
                      profile?.username ? `/${profile.username}` : '/profile'
                    }
                    className="block px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="pt-4">
                    <SignOutButton />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/auth/sign-in"
                    className="block"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="secondary" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="block"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="primary" size="md" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
