import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PostList from '../PostList';
import { PostsServiceProvider } from '@/lib/posts-context';
import { PostsService } from '@/lib/posts';

// Mock the posts service
vi.mock('@/lib/posts');
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

describe('PostList', () => {
  let mockPostsService: {
    getActivePosts: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockPostsService = {
      getActivePosts: vi.fn(),
    };
    vi.mocked(PostsService).mockImplementation(
      () => mockPostsService as unknown as PostsService
    );
  });

  it('should display empty state when there are no posts', async () => {
    mockPostsService.getActivePosts.mockResolvedValue([]);

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/be the first to share/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('should display posts when there are posts available', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post',
        author_id: 'user1',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          id: 'user1',
          username: 'testuser',
          full_name: 'Test User',
          avatar_url: null,
        },
      },
    ];

    mockPostsService.getActivePosts.mockResolvedValue(mockPosts);

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/be the first to share/i)
    ).not.toBeInTheDocument();
  });

  it('should display loading state while fetching posts', () => {
    mockPostsService.getActivePosts.mockReturnValue(new Promise(() => {}));

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    mockPostsService.getActivePosts.mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/error.*fetch/i)).not.toBeInTheDocument();
  });
});
