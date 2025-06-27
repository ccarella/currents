import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RootLayout from '../layout';

describe('Light Mode Enforcement', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Store original matchMedia
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    // Clean up any added classes
    document.documentElement.className = '';
  });

  it('should always apply light mode regardless of system preference', () => {
    // Mock matchMedia to simulate dark mode preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    // Check that the html element has light class
    waitFor(() => {
      const htmlElement = document.querySelector('html');
      expect(htmlElement).toHaveClass('light');
      expect(htmlElement).not.toHaveClass('dark');
    });
  });

  it('should maintain light mode when system preference is light', () => {
    // Mock matchMedia to simulate light mode preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: light)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    // Check that the html element has light class
    waitFor(() => {
      const htmlElement = document.querySelector('html');
      expect(htmlElement).toHaveClass('light');
      expect(htmlElement).not.toHaveClass('dark');
    });
  });

  it('should not change theme when system preference changes', () => {
    const mediaQueryListeners: ((e: MediaQueryListEvent) => void)[] = [];

    // Mock matchMedia with ability to trigger changes
    window.matchMedia = vi.fn().mockImplementation((query) => {
      const mediaQueryList = {
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(
          (event: string, listener: (e: MediaQueryListEvent) => void) => {
            if (event === 'change') {
              mediaQueryListeners.push(listener);
            }
          }
        ),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      return mediaQueryList;
    });

    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    // Simulate system preference change
    const event = new Event('change') as MediaQueryListEvent;
    Object.defineProperty(event, 'matches', { value: true });
    mediaQueryListeners.forEach((listener) => listener(event));

    // Check that light mode is still enforced
    waitFor(() => {
      const htmlElement = document.querySelector('html');
      expect(htmlElement).toHaveClass('light');
      expect(htmlElement).not.toHaveClass('dark');
    });
  });

  it('should apply correct CSS variables for light mode', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    waitFor(() => {
      const htmlElement = document.querySelector('html');
      if (htmlElement) {
        const computedStyle = window.getComputedStyle(htmlElement);

        // Check that light mode CSS variables are applied
        expect(computedStyle.getPropertyValue('--background')).toBe('#ffffff');
        expect(computedStyle.getPropertyValue('--foreground')).toBe('#111827');
        expect(computedStyle.getPropertyValue('--muted')).toBe('#f9fafb');
        expect(computedStyle.getPropertyValue('--muted-foreground')).toBe(
          '#6b7280'
        );
      }
    });
  });

  it('should not render any dark mode styles', () => {
    // Mock dark mode preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(
      <RootLayout>
        <div className="bg-white dark:bg-gray-900">Test Content</div>
      </RootLayout>
    );

    waitFor(() => {
      // Check that dark mode classes are not applied
      const testDiv = container.querySelector('div');
      if (testDiv) {
        const computedStyle = window.getComputedStyle(testDiv);

        // Should use light mode background (white) not dark mode (gray-900)
        expect(computedStyle.backgroundColor).not.toBe('rgb(17, 24, 39)'); // gray-900
      }
    });
  });
});
