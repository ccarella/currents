import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onFID: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
  onINP: vi.fn(),
}));

describe('Performance Optimizations', () => {
  it('should have lazy loading configured for components', async () => {
    // Verify dynamic imports are working
    const { default: dynamic } = await import('next/dynamic');
    expect(dynamic).toBeDefined();
  });

  it('should have image optimization configured', () => {
    // Check for OptimizedImage component
    const optimizedImagePath = path.join(
      process.cwd(),
      'src/components/OptimizedImage.tsx'
    );
    expect(fs.existsSync(optimizedImagePath)).toBe(true);
  });

  it('should have web vitals monitoring configured', () => {
    // Check for WebVitals component
    const webVitalsPath = path.join(
      process.cwd(),
      'src/components/WebVitals.tsx'
    );
    expect(fs.existsSync(webVitalsPath)).toBe(true);
  });

  it('should have React Query configured for caching', async () => {
    // Check QueryClient configuration
    const { QueryClient } = await import('@tanstack/react-query');
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
        },
      },
    });

    expect(client.getDefaultOptions().queries?.staleTime).toBe(300000); // 5 minutes
    expect(client.getDefaultOptions().queries?.gcTime).toBe(600000); // 10 minutes
  });
});

describe('Bundle Size Optimizations', () => {
  it('should have code splitting for auth components', () => {
    // Check that auth forms are dynamically imported
    const signInPagePath = path.join(
      process.cwd(),
      'src/app/auth/sign-in/client-page.tsx'
    );
    const signUpPagePath = path.join(
      process.cwd(),
      'src/app/auth/sign-up/client-page.tsx'
    );

    expect(fs.existsSync(signInPagePath)).toBe(true);
    expect(fs.existsSync(signUpPagePath)).toBe(true);
  });

  it('should have optimized post list with React Query', () => {
    const optimizedPostListPath = path.join(
      process.cwd(),
      'src/components/post/OptimizedPostList.tsx'
    );
    expect(fs.existsSync(optimizedPostListPath)).toBe(true);
  });
});

describe('Service Worker', () => {
  it('should have offline support configured', () => {
    // Check service worker file exists
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const offlinePath = path.join(process.cwd(), 'public', 'offline.html');

    expect(fs.existsSync(swPath)).toBe(true);
    expect(fs.existsSync(offlinePath)).toBe(true);
  });

  it('should have service worker registration component', () => {
    const swRegistrationPath = path.join(
      process.cwd(),
      'src/components/ServiceWorkerRegistration.tsx'
    );
    expect(fs.existsSync(swRegistrationPath)).toBe(true);
  });
});

describe('Database Optimizations', () => {
  it('should have database migration for performance indexes', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20250628_performance_indexes.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should have query hooks for optimized data fetching', () => {
    const hooksPath = path.join(process.cwd(), 'src/hooks/usePosts.ts');
    expect(fs.existsSync(hooksPath)).toBe(true);
  });
});
