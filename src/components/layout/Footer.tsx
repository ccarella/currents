import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12">
          {/* Main Footer Content */}
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Currents
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A clean, typography-focused platform for thoughtful writing.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Platform
              </h4>
              <nav className="flex flex-col space-y-1">
                <Link
                  href="/explore"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Explore
                </Link>
                <Link
                  href="/write"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Write
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Resources
              </h4>
              <nav className="flex flex-col space-y-1">
                <Link
                  href="/about"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  About
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Terms
                </Link>
              </nav>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Connect
              </h4>
              <nav className="flex flex-col space-y-1">
                <a
                  href="https://x.com/ccarella"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  X.com
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  GitHub
                </a>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white py-2 -ml-1 pl-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Currents. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
