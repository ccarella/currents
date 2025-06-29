import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-white safe-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12">
          {/* Main Footer Content */}
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Currents</h3>
              <p className="text-sm text-gray-600">
                A clean, typography-focused platform for thoughtful writing.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Platform</h4>
              <nav className="flex flex-col space-y-1">
                <Link
                  href="/write"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  Write
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Resources</h4>
              <nav className="flex flex-col space-y-1">
                <Link
                  href="/about"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  About
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  Terms
                </Link>
              </nav>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Connect</h4>
              <nav className="flex flex-col space-y-1">
                <a
                  href="https://x.com/ccarella"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  X.com
                </a>
                <a
                  href="https://github.com/ccarella/currents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  GitHub
                </a>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 py-2 -ml-1 pl-1 rounded hover:bg-gray-50"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              © {currentYear} Currents. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
