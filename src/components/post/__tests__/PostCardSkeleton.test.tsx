import { render } from '@testing-library/react';
import PostCardSkeleton from '../PostCardSkeleton';

describe('PostCardSkeleton', () => {
  it('renders skeleton structure matching PostCard layout', () => {
    const { container } = render(<PostCardSkeleton />);

    // Should have article wrapper
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass(
      'bg-white',
      'dark:bg-gray-800',
      'rounded-lg',
      'shadow',
      'p-6'
    );
  });

  it('renders avatar skeleton', () => {
    const { container } = render(<PostCardSkeleton />);

    // Avatar skeleton should be circular
    const avatarSkeleton = container.querySelector('.h-10.w-10.rounded-full');
    expect(avatarSkeleton).toBeInTheDocument();
    expect(avatarSkeleton).toHaveClass('animate-pulse');
  });

  it('renders content skeletons with appropriate sizes', () => {
    const { container } = render(<PostCardSkeleton />);

    // Should have multiple skeleton elements for different content areas
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(5); // Avatar, name, username, date, title, content lines
  });

  it('has proper layout structure', () => {
    const { container } = render(<PostCardSkeleton />);

    // Should have flex layout for avatar and content
    const flexContainer = container.querySelector(
      '.flex.items-start.space-x-3'
    );
    expect(flexContainer).toBeInTheDocument();

    // Should have content container
    const contentContainer = container.querySelector('.flex-1.min-w-0');
    expect(contentContainer).toBeInTheDocument();
  });

  it('renders multiple content line skeletons', () => {
    const { container } = render(<PostCardSkeleton />);

    // Should have multiple lines for post content
    const contentLines = container.querySelectorAll(
      '.space-y-2 > [class*="animate-pulse"]'
    );
    expect(contentLines.length).toBe(3);
  });
});
