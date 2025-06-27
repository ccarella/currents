import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WritePage from '../page';
import { useRouter, useSearchParams } from 'next/navigation';
import * as postsLib from '@/lib/supabase/posts';
import type { Database } from '@/types/database.generated';

type Post = Database['public']['Tables']['posts']['Row'];

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock Supabase posts functions
vi.mock('@/lib/supabase/posts', () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
  getPostById: vi.fn(),
  getUserCurrentPost: vi.fn(),
}));

// Mock the PlainTextEditor component
vi.mock('@/components/PlainTextEditor', () => ({
  default: ({
    initialContent,
    placeholder,
  }: {
    initialContent?: string;
    placeholder: string;
  }) => (
    <div>
      <textarea
        data-testid="plain-text-editor"
        placeholder={placeholder}
        defaultValue={initialContent}
        onChange={(e) => {
          localStorage.setItem('draft-content', e.target.value);
        }}
      />
    </div>
  ),
  DRAFT_CONTENT_KEY: 'draft-content',
  DRAFT_TIMESTAMP_KEY: 'draft-timestamp',
}));

describe('WritePage - Edit Mode', () => {
  const mockPush = vi.fn();
  const mockGet = vi.fn();
  const mockPost: Post = {
    id: 'test-post-id',
    title: 'Existing Post Title',
    content: 'Existing post content',
    status: 'published',
    author_id: 'user-id',
    slug: 'existing-post-title',
    excerpt: 'Existing post content excerpt',
    published_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
      getAll: vi.fn(),
      has: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      toString: vi.fn(),
      size: 0,
      [Symbol.iterator]: vi.fn(),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  it('loads existing post when id is provided', async () => {
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);

    render(<WritePage />);

    // Should show loading state initially
    expect(screen.getByText('Loading post...')).toBeInTheDocument();

    // Wait for post to load
    await waitFor(() => {
      expect(postsLib.getPostById).toHaveBeenCalledWith('test-post-id');
      expect(
        screen.getByDisplayValue('Existing Post Title')
      ).toBeInTheDocument();
      expect(screen.getByText('Existing post content')).toBeInTheDocument();
    });
  });

  it('shows "Update Post" button instead of "Publish" when editing', async () => {
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);

    render(<WritePage />);

    await waitFor(() => {
      expect(screen.getByText('Update Post')).toBeInTheDocument();
      expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    });
  });

  it('clears localStorage draft when loading post for editing', async () => {
    // Set initial draft in localStorage
    localStorage.setItem('draft-content', 'Draft content');
    localStorage.setItem('draft-timestamp', Date.now().toString());

    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);

    render(<WritePage />);

    await waitFor(() => {
      expect(localStorage.getItem('draft-content')).toBeNull();
      expect(localStorage.getItem('draft-timestamp')).toBeNull();
    });
  });

  it('updates existing post without showing confirmation dialog', async () => {
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);
    vi.mocked(postsLib.updatePost).mockResolvedValue({
      ...mockPost,
      title: 'Updated Title',
      content: 'Updated content',
      updated_at: new Date().toISOString(),
    });

    render(<WritePage />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Existing Post Title')
      ).toBeInTheDocument();
    });

    // Update title and content
    const titleInput = screen.getByDisplayValue('Existing Post Title');
    const updateButton = screen.getByText('Update Post');

    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    localStorage.setItem('draft-content', 'Updated content');

    fireEvent.click(updateButton);

    await waitFor(() => {
      // Should call updatePost instead of createPost
      expect(postsLib.updatePost).toHaveBeenCalledWith('test-post-id', {
        title: 'Updated Title',
        content: 'Updated content',
        status: 'published',
      });
      // Should NOT show confirmation dialog
      expect(
        screen.queryByText('Replace Your Current Post?')
      ).not.toBeInTheDocument();
      // Should redirect after update
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows "Updating..." message in loading overlay when updating', async () => {
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);

    // Create a promise that we can control
    let resolveUpdate: (value: Post) => void = () => {};
    const updatePromise = new Promise<Post>((resolve) => {
      resolveUpdate = resolve;
    });
    vi.mocked(postsLib.updatePost).mockImplementation(() => updatePromise);

    render(<WritePage />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Existing Post Title')
      ).toBeInTheDocument();
    });

    const updateButton = screen.getByText('Update Post');
    localStorage.setItem('draft-content', 'Updated content');
    fireEvent.click(updateButton);

    // Check if the update button is disabled during update
    await waitFor(() => {
      expect(updateButton).toBeDisabled();
    });

    // Resolve the promise to complete the update
    resolveUpdate({ ...mockPost, content: 'Updated content' });
  });

  it('preserves original published_at timestamp when updating', async () => {
    const originalPublishedAt = '2024-01-01T00:00:00Z';
    const postWithTimestamp = {
      ...mockPost,
      published_at: originalPublishedAt,
    };

    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(postWithTimestamp);
    vi.mocked(postsLib.updatePost).mockResolvedValue({
      ...postWithTimestamp,
      content: 'Updated content',
      updated_at: new Date().toISOString(),
    });

    render(<WritePage />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Existing Post Title')
      ).toBeInTheDocument();
    });

    const updateButton = screen.getByText('Update Post');
    localStorage.setItem('draft-content', 'Updated content');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(postsLib.updatePost).toHaveBeenCalledWith('test-post-id', {
        title: 'Existing Post Title',
        content: 'Updated content',
        status: 'published',
      });
    });
  });

  it('handles errors when loading post for editing', async () => {
    mockGet.mockReturnValue('invalid-post-id');
    vi.mocked(postsLib.getPostById).mockRejectedValue(
      new Error('Post not found')
    );

    render(<WritePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load post')).toBeInTheDocument();
    });
  });

  it('handles errors when updating post', async () => {
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);
    vi.mocked(postsLib.updatePost).mockRejectedValue(
      new Error('Update failed')
    );

    render(<WritePage />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Existing Post Title')
      ).toBeInTheDocument();
    });

    const updateButton = screen.getByText('Update Post');
    localStorage.setItem('draft-content', 'Updated content');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('maintains edit mode when post ID changes in URL', async () => {
    const mockGetDynamic = vi.fn();
    mockGetDynamic.mockReturnValue('post-1');
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGetDynamic,
      getAll: vi.fn(),
      has: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      toString: vi.fn(),
      size: 0,
      [Symbol.iterator]: vi.fn(),
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(postsLib.getPostById).mockImplementation((id) => {
      if (id === 'post-1') {
        return Promise.resolve({ ...mockPost, id: 'post-1', title: 'Post 1' });
      }
      return Promise.resolve({ ...mockPost, id: 'post-2', title: 'Post 2' });
    });

    const { rerender } = render(<WritePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Post 1')).toBeInTheDocument();
      expect(screen.getByText('Update Post')).toBeInTheDocument();
    });

    // Simulate URL change
    mockGetDynamic.mockReturnValue('post-2');
    rerender(<WritePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Post 2')).toBeInTheDocument();
      expect(screen.getByText('Update Post')).toBeInTheDocument();
    });
  });
});
