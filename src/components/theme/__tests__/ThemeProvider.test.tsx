import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';

describe('ThemeProvider', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Store original matchMedia
    originalMatchMedia = window.matchMedia;
    // Reset document classes
    document.documentElement.className = '';
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    // Clean up
    document.documentElement.className = '';
  });

  it('should add light class to html element on mount', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should remove dark class if present', () => {
    // Simulate dark class being present
    document.documentElement.classList.add('dark');

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).toHaveClass('light');
  });

  it('should prevent dark mode even with system preference', () => {
    // Mock dark mode system preference
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
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should not listen to system theme changes', () => {
    const addEventListenerSpy = vi.fn();

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerSpy,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );

    // Should not add any listeners for theme changes
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should maintain light class throughout component lifecycle', () => {
    const { rerender } = render(
      <ThemeProvider>
        <div>Initial Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveClass('light');

    // Simulate a re-render
    rerender(
      <ThemeProvider>
        <div>Updated Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should render children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Child Component</div>;

    render(
      <ThemeProvider>
        <TestChild />
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });
});
