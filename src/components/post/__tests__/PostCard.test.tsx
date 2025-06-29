import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import PostCard from '../PostCard';
import type { Database } from '@/types/database.types';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

type PostWithProfile = Database['public']['Tables']['posts']['Row'] & {
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

const mockPost: PostWithProfile = {
  id: '1',
  title: 'Test Post',
  content: 'This is a test post content',
  excerpt: null,
  author_id: 'user-1',
  status: 'published',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  published_at: '2024-01-01T00:00:00.000Z',
  metadata: null,
  profiles: {
    id: 'user-1',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
  },
};

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: vi.fn(),
      forward: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
  });

  it('renders post with short content without truncation', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  it('truncates content longer than 500 characters', () => {
    const longContent = 'a'.repeat(600);
    const postWithLongContent = {
      ...mockPost,
      content: longContent,
    };

    render(<PostCard post={postWithLongContent} />);

    // Should show truncated content (500 chars + ellipsis)
    const contentElement = screen.getByText((content, element) => {
      return (
        (element?.textContent?.startsWith('a'.repeat(500)) &&
          element?.textContent?.endsWith('...')) ||
        false
      );
    });
    expect(contentElement).toBeInTheDocument();

    // Should show "Show more" button
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('preserves word boundaries when truncating', () => {
    const content =
      'This is a test post with exactly the right amount of words to test truncation at word boundaries. '.repeat(
        6
      );
    const postWithContent = {
      ...mockPost,
      content,
    };

    render(<PostCard post={postWithContent} />);

    // Content should be truncated but not in the middle of a word
    const contentElement = screen.getByText((text, element) => {
      const textContent = element?.textContent || '';
      return (
        textContent.length <= 503 && // 500 + "..."
        textContent.endsWith('...') &&
        !textContent.includes(' ...')
      ); // No space before ellipsis
    });
    expect(contentElement).toBeInTheDocument();
  });

  it('navigates to user profile when Show more is clicked', async () => {
    const user = userEvent.setup();
    const longContent = 'a'.repeat(600);
    const postWithLongContent = {
      ...mockPost,
      content: longContent,
    };

    render(<PostCard post={postWithLongContent} />);

    const showMoreButton = screen.getByText('Show more');
    await user.click(showMoreButton);

    expect(mockPush).toHaveBeenCalledWith('/testuser');
  });

  it('handles posts without title correctly', () => {
    const postWithoutTitle = {
      ...mockPost,
      title: null,
    };

    render(<PostCard post={postWithoutTitle} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
  });

  it('shows user avatar when available', () => {
    const postWithAvatar = {
      ...mockPost,
      profiles: {
        ...mockPost.profiles,
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };

    render(<PostCard post={postWithAvatar} />);

    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
    // Next.js Image component transforms the src URL
    expect(avatar).toHaveAttribute('src');
    expect(avatar.getAttribute('src')).toContain(
      'https%3A%2F%2Fexample.com%2Favatar.jpg'
    );
  });

  it('shows user initial when avatar is not available', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<PostCard post={mockPost} />);

    // The date format might vary based on timezone, so we check for the presence of the date element
    const dateElement = screen.getByText((content, element) => {
      return (
        element?.tagName === 'P' &&
        element?.className?.includes('text-sm text-gray-500') &&
        /\w{3} \d{1,2}, \d{4}/.test(element?.textContent || '')
      );
    });
    expect(dateElement).toBeInTheDocument();
  });

  it('handles special characters and emojis in content', () => {
    const contentWithSpecialChars =
      'Hello 👋 This is a post with "quotes" & special chars < > that should be handled properly.';
    const postWithSpecialContent = {
      ...mockPost,
      content: contentWithSpecialChars,
    };

    render(<PostCard post={postWithSpecialContent} />);

    expect(screen.getByText(contentWithSpecialChars)).toBeInTheDocument();
  });

  it('truncates content with line breaks correctly', () => {
    const contentWithLineBreaks =
      'Line 1\n\nLine 2\n\nLine 3\n\n' + 'a'.repeat(500);
    const postWithLineBreaks = {
      ...mockPost,
      content: contentWithLineBreaks,
    };

    render(<PostCard post={postWithLineBreaks} />);

    // Should preserve line breaks in truncated content
    const contentElement = screen.getByText((text, element) => {
      const textContent = element?.textContent || '';
      return (
        textContent.includes('Line 1') &&
        textContent.includes('Line 2') &&
        textContent.endsWith('...')
      );
    });
    expect(contentElement).toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });
});
