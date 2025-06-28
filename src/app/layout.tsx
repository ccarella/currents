import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Spectral } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { WebVitals } from '@/components/WebVitals';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { QueryProvider } from '@/lib/providers/QueryProvider';

// Optimize font loading with subset and display swap
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: true,
  weight: ['400', '500', '600'],
});

const spectral = Spectral({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-spectral',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Currents Platform',
  description: 'Design system showcase with optimized typography',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`light ${inter.variable} ${spectral.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent flash of unstyled content by setting light mode immediately
              // This runs before React hydration to ensure consistent theming
              (function() {
                const root = document.documentElement;
                root.classList.remove('dark');
                root.classList.add('light');
              })();
            `.trim(),
          }}
        />
      </head>
      <body className="font-serif antialiased flex flex-col min-h-screen">
        <WebVitals />
        <ServiceWorkerRegistration />
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
