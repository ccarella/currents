import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PostList from '../PostList';
import { PostsServiceProvider } from '@/lib/posts-context';
import { PostsService } from '@/lib/posts';

// Mock the posts service
vi.mock('@/lib/posts');
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock the useInfiniteScroll hook
vi.mock('@/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn(),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('PostList', () => {
  let mockPostsService: {
    getActivePosts: ReturnType<typeof vi.fn>;
    getActivePostsPaginated: ReturnType<typeof vi.fn>;
  };
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: vi.fn(),
      forward: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);

    mockPostsService = {
      getActivePosts: vi.fn(),
      getActivePostsPaginated: vi.fn(),
    };
    vi.mocked(PostsService).mockImplementation(
      () => mockPostsService as unknown as PostsService
    );
  });

  it('should display empty state when there are no posts', async () => {
    mockPostsService.getActivePostsPaginated.mockResolvedValue({
      posts: [],
      totalCount: 0,
      hasMore: false,
    });

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
        user_id: 'user1',
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

    mockPostsService.getActivePostsPaginated.mockResolvedValue({
      posts: mockPosts,
      totalCount: 1,
      hasMore: false,
    });

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
    mockPostsService.getActivePostsPaginated.mockReturnValue(
      new Promise(() => {})
    );

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    // Check for loading skeletons instead of loading text
    expect(
      screen.getByRole('status', { name: 'Loading posts' })
    ).toBeInTheDocument();
  });

  it('should handle error state gracefully', async () => {
    mockPostsService.getActivePostsPaginated.mockRejectedValue(
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

  it('should display "no more posts" message when all posts are loaded', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        slug: 'test-post',
        user_id: 'user1',
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

    mockPostsService.getActivePostsPaginated.mockResolvedValue({
      posts: mockPosts,
      totalCount: 1,
      hasMore: false,
    });

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No more posts to load')).toBeInTheDocument();
    });
  });

  it('should paginate correctly when hasMore is true', async () => {
    const firstBatch = [
      {
        id: '1',
        title: 'Test Post 1',
        content: 'Test content 1',
        slug: 'test-post-1',
        user_id: 'user1',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          id: 'user1',
          username: 'testuser1',
          full_name: 'Test User 1',
          avatar_url: null,
        },
      },
    ];

    mockPostsService.getActivePostsPaginated.mockResolvedValue({
      posts: firstBatch,
      totalCount: 25,
      hasMore: true,
    });

    render(
      <PostsServiceProvider>
        <PostList />
      </PostsServiceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });

    expect(mockPostsService.getActivePostsPaginated).toHaveBeenCalledWith(
      1,
      20
    );
  });
});
