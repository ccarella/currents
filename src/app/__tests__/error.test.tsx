import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorPage from '../error';

describe('ErrorPage', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test error message') as Error & {
    digest?: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders error heading', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    const heading = screen.getByText('Something went wrong');
    expect(heading).toBeInTheDocument();
  });

  it('renders error description', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    const description = screen.getByText(/An unexpected error occurred/);
    expect(description).toBeInTheDocument();
  });

  it('renders try again button', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    const button = screen.getByRole('button', { name: 'Try Again' });
    expect(button).toBeInTheDocument();
  });

  it('calls reset function when try again is clicked', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    const button = screen.getByRole('button', { name: 'Try Again' });

    fireEvent.click(button);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('logs error to console', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith(
      'Error boundary caught:',
      mockError
    );
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ErrorPage error={mockError} reset={mockReset} />);
    const details = screen.getByText('Error details');
    expect(details).toBeInTheDocument();

    // The error message is inside a pre element
    const errorMessage = screen.getByText(/Test error message/, {
      selector: 'pre',
    });
    expect(errorMessage).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<ErrorPage error={mockError} reset={mockReset} />);
    const details = screen.queryByText('Error details');
    expect(details).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
