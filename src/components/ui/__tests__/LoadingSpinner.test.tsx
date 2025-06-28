import { render } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]') as HTMLElement;

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
  });

  it('renders with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector('[role="status"]') as HTMLElement;

    expect(spinner).toHaveClass('h-4');
    expect(spinner).toHaveClass('w-4');
  });

  it('renders with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('[role="status"]') as HTMLElement;

    expect(spinner).toHaveClass('h-12');
    expect(spinner).toHaveClass('w-12');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <LoadingSpinner className="my-custom-class" />
    );
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass('my-custom-class');
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]') as HTMLElement;

    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
  });

  it('uses custom label', () => {
    const { container, getByText } = render(
      <LoadingSpinner label="Processing request..." />
    );
    const spinner = container.querySelector('[role="status"]') as HTMLElement;

    expect(spinner).toHaveAttribute('aria-label', 'Processing request...');
    expect(getByText('Processing request...')).toHaveClass('sr-only');
  });

  it('has animation classes', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[role="status"]') as HTMLElement;

    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('rounded-full');
    expect(spinner).toHaveClass('border-t-transparent');
  });
});
