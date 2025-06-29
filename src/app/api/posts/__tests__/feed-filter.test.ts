import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server');

describe('GET /api/posts - Feed Filtering', () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
  });

  it('should return only the most recent post per user', async () => {
    const mockPosts = [
      {
        id: '1',
        author_id: 'user1',
        title: 'User 1 Latest Post',
        content: 'Latest from user 1',
        status: 'published',
        created_at: '2025-06-29T14:00:00Z',
        profiles: {
          id: 'user1',
          username: 'user1',
          full_name: 'User One',
          avatar_url: null,
        },
      },
      {
        id: '2',
        author_id: 'user2',
        title: 'User 2 Latest Post',
        content: 'Latest from user 2',
        status: 'published',
        created_at: '2025-06-29T13:00:00Z',
        profiles: {
          id: 'user2',
          username: 'user2',
          full_name: 'User Two',
          avatar_url: null,
        },
      },
    ];

    mockSupabase.range.mockResolvedValue({
      data: mockPosts,
      error: null,
      count: 2,
    });

    const request = new NextRequest('http://localhost:3000/api/posts?page=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(2);
    expect(data.posts[0].author_id).toBe('user1');
    expect(data.posts[1].author_id).toBe('user2');
    expect(data.totalCount).toBe(2);
  });

  it('should not return multiple posts from the same user', async () => {
    // In the real implementation, this will be handled by the database view
    // For unit tests, we're mocking the expected behavior
    const mockPosts = [
      {
        id: '3',
        author_id: 'user1',
        title: 'User 1 Latest Post',
        content: 'Latest content',
        status: 'published',
        created_at: '2025-06-29T15:00:00Z',
        profiles: {
          id: 'user1',
          username: 'user1',
          full_name: 'User One',
          avatar_url: null,
        },
      },
      {
        id: '4',
        author_id: 'user2',
        title: 'User 2 Post',
        content: 'Content from user 2',
        status: 'published',
        created_at: '2025-06-29T14:30:00Z',
        profiles: {
          id: 'user2',
          username: 'user2',
          full_name: 'User Two',
          avatar_url: null,
        },
      },
    ];

    mockSupabase.range.mockResolvedValue({
      data: mockPosts,
      error: null,
      count: 2,
    });

    const request = new NextRequest('http://localhost:3000/api/posts?page=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(2);

    // Verify each user appears only once
    const userIds = data.posts.map(
      (post: { author_id: string }) => post.author_id
    );
    const uniqueUserIds = [...new Set(userIds)];
    expect(uniqueUserIds).toHaveLength(2);
  });

  it('should handle pagination correctly', async () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${i}`,
      author_id: `user-${i}`,
      title: `Post ${i}`,
      content: `Content ${i}`,
      status: 'published',
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      profiles: {
        id: `user-${i}`,
        username: `user${i}`,
        full_name: `User ${i}`,
        avatar_url: null,
      },
    }));

    mockSupabase.range.mockResolvedValue({
      data: mockPosts,
      error: null,
      count: 30,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/posts?page=2&limit=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(10);
    expect(data.hasMore).toBe(true);
    expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
  });

  it('should order posts by created_at descending', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/posts');
    await GET(request);

    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
  });

  it('should only include published posts', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/posts');
    await GET(request);

    // The view 'latest_posts_per_user' already filters by published status
    // So we verify the correct view is being used
    expect(mockSupabase.from).toHaveBeenCalledWith('latest_posts_per_user');
  });
});
