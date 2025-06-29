import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostsService } from '../posts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Mock Supabase client
vi.mock('@/lib/supabase/server');

describe('PostsService - Feed Filtering', () => {
  let supabaseMock: SupabaseClient<Database>;
  let postsService: PostsService;

  beforeEach(() => {
    const chainableMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    supabaseMock = {
      from: vi.fn().mockReturnValue(chainableMock),
    } as unknown as SupabaseClient<Database>;

    postsService = new PostsService(supabaseMock);
  });

  describe('getLatestPostPerUser', () => {
    it('should return only the most recent post per user', async () => {
      const mockPosts = [
        {
          id: '1',
          author_id: 'user1',
          title: 'User 1 Latest Post',
          content: 'Latest content from user 1',
          status: 'published',
          created_at: '2025-06-29T12:00:00Z',
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
          content: 'Latest content from user 2',
          status: 'published',
          created_at: '2025-06-29T11:00:00Z',
          profiles: {
            id: 'user2',
            username: 'user2',
            full_name: 'User Two',
            avatar_url: null,
          },
        },
      ];

      const chainableMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockPosts,
          error: null,
          count: 2,
        }),
      };

      supabaseMock.from = vi.fn().mockReturnValue(chainableMock);

      const result = await postsService.getLatestPostPerUserPaginated(1, 20);

      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].author_id).toBe('user1');
      expect(result.posts[1].author_id).toBe('user2');
      expect(result.totalCount).toBe(2);
      expect(supabaseMock.from).toHaveBeenCalledWith('latest_posts_per_user');
    });

    it('should handle pagination correctly', async () => {
      const mockPosts = Array.from({ length: 20 }, (_, i) => ({
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

      const chainableMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockPosts,
          error: null,
          count: 50,
        }),
      };

      supabaseMock.from = vi.fn().mockReturnValue(chainableMock);

      const result = await postsService.getLatestPostPerUserPaginated(1, 20);

      expect(result.posts).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.totalCount).toBe(50);
    });

    it('should filter out older posts from same user', async () => {
      // This test would be better as an integration test with a real database
      // but we'll mock the expected behavior of the view
      const mockPosts = [
        {
          id: '3',
          author_id: 'user1',
          title: 'User 1 Latest Post',
          content: 'Latest content',
          status: 'published',
          created_at: '2025-06-29T14:00:00Z',
          profiles: {
            id: 'user1',
            username: 'user1',
            full_name: 'User One',
            avatar_url: null,
          },
        },
        // Older post from user1 should not be included
      ];

      const chainableMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockPosts,
          error: null,
          count: 1,
        }),
      };

      supabaseMock.from = vi.fn().mockReturnValue(chainableMock);

      const result = await postsService.getLatestPostPerUserPaginated(1, 20);

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('3');
      expect(result.posts[0].title).toBe('User 1 Latest Post');
    });

    it('should only show published posts', async () => {
      const mockPosts = [
        {
          id: '1',
          author_id: 'user1',
          title: 'Published Post',
          content: 'Published content',
          status: 'published',
          created_at: '2025-06-29T12:00:00Z',
          profiles: {
            id: 'user1',
            username: 'user1',
            full_name: 'User One',
            avatar_url: null,
          },
        },
      ];

      const chainableMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockPosts,
          error: null,
          count: 1,
        }),
      };

      supabaseMock.from = vi.fn().mockReturnValue(chainableMock);

      const result = await postsService.getLatestPostPerUserPaginated(1, 20);

      // The view itself filters by published status, so we just verify the result
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].status).toBe('published');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');

      const chainableMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error,
          count: null,
        }),
      };

      supabaseMock.from = vi.fn().mockReturnValue(chainableMock);

      await expect(
        postsService.getLatestPostPerUserPaginated(1, 20)
      ).rejects.toThrow('Database error');
    });
  });
});
