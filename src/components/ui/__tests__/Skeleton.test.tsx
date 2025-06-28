import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-gray-200');
    expect(skeleton).toHaveClass('dark:bg-gray-800');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="w-full h-4" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('w-full');
    expect(skeleton).toHaveClass('h-4');
  });

  it('has aria-hidden attribute for accessibility', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('spreads additional props', () => {
    const { container } = render(<Skeleton data-testid="skeleton-test" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveAttribute('data-testid', 'skeleton-test');
  });
});
