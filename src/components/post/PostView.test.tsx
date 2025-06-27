import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PostView from './PostView';
import { Database } from '@/types/database.generated';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
};

// Mock the Supabase client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Mock ShareButton
vi.mock('@/components/ui/ShareButton', () => ({
  default: ({ url, title }: { url: string; title: string }) => (
    <button data-testid="share-button" data-url={url} data-title={title}>
      Share
    </button>
  ),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="edit-link">
      {children}
    </a>
  ),
}));

describe('PostView', () => {
  const mockProfile: Profile = {
    id: '123',
    username: 'testuser',
    full_name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockPost: Post = {
    id: '456',
    title: 'Test Post Title',
    content:
      '# Hello World\n\nThis is a **test** post with [a link](https://example.com).',
    slug: 'test-post',
    excerpt: 'Test excerpt',
    author_id: '123',
    status: 'published',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    published_at: '2024-01-15T10:00:00Z',
    profiles: {
      id: '123',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
    // Default mock for getUser
    mockGetUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });
  });

  it('renders post header with author information', () => {
    render(<PostView post={mockPost} profile={mockProfile} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test User' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('renders post title and date', () => {
    render(<PostView post={mockPost} profile={mockProfile} />);

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });

  it('renders markdown content correctly', () => {
    render(<PostView post={mockPost} profile={mockProfile} />);

    // Check for rendered markdown elements
    expect(
      screen.getByRole('heading', { name: 'Hello World' })
    ).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    // Check for bold text - in ReactMarkdown bold text is in a <strong> element
    const strongElement = screen.getByText('test');
    expect(strongElement.tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'a link' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('shows edit button for post owner with post ID', async () => {
    render(<PostView post={mockPost} profile={mockProfile} />);

    await waitFor(() => {
      const editLink = screen.getByTestId('edit-link');
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute('href', '/write?id=456');
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  it('does not show edit button for non-owner', async () => {
    // Mock getUser to return a different user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'different-user' } },
      error: null,
    });

    render(<PostView post={mockPost} profile={mockProfile} />);

    await waitFor(() => {
      expect(screen.queryByTestId('edit-link')).not.toBeInTheDocument();
    });
  });

  it('renders share button with correct props', () => {
    render(<PostView post={mockPost} profile={mockProfile} />);

    const shareButton = screen.getByTestId('share-button');
    expect(shareButton).toHaveAttribute('data-url', '/testuser');
    expect(shareButton).toHaveAttribute('data-title', 'Test Post Title');
  });

  it('uses creation date when published date is not available', () => {
    const postWithoutPublishedDate = { ...mockPost, published_at: null };

    render(<PostView post={postWithoutPublishedDate} profile={mockProfile} />);

    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });

  it('renders without avatar when not provided', () => {
    const postWithoutAvatar = {
      ...mockPost,
      profiles: { ...mockPost.profiles, avatar_url: null },
    };

    render(<PostView post={postWithoutAvatar} profile={mockProfile} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders without title when not provided', () => {
    const postWithoutTitle = { ...mockPost, title: null };

    render(<PostView post={postWithoutTitle} profile={mockProfile} />);

    // The h1 heading for the title specifically should not exist
    expect(screen.queryByText('Test Post Title')).not.toBeInTheDocument();
  });

  it('handles complex markdown content', () => {
    const complexPost = {
      ...mockPost,
      content: `
## Subheading

- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third

> This is a blockquote

\`\`\`javascript
const code = "example";
\`\`\`

Inline \`code\` example.
      `,
    };

    render(<PostView post={complexPost} profile={mockProfile} />);

    expect(
      screen.getByRole('heading', { name: 'Subheading' })
    ).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('This is a blockquote')).toBeInTheDocument();
    expect(screen.getByText('const code = "example";')).toBeInTheDocument();
  });
});
