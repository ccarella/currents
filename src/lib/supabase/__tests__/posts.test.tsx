/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost, updatePost } from '../posts';
import { createClient } from '../client';

// Mock the Supabase client
vi.mock('../client', () => ({
  createClient: vi.fn(),
}));

// Mock ensureUserProfile
vi.mock('../profiles', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue({ success: true }),
}));

describe('posts', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  const mockFrom = {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    mockSupabase.from.mockReturnValue(mockFrom);
    mockFrom.insert.mockReturnValue(mockFrom);
    mockFrom.update.mockReturnValue(mockFrom);
    mockFrom.select.mockReturnValue(mockFrom);
    mockFrom.eq.mockReturnValue(mockFrom);
    mockFrom.single.mockResolvedValue({
      data: { id: 'post-123' },
      error: null,
    });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
  });

  describe('createPost', () => {
    it('should set published_at when creating a published post', async () => {
      const beforeTime = new Date().toISOString();

      await createPost({
        title: 'Test Post',
        content: 'Test content',
        status: 'published',
      });

      const afterTime = new Date().toISOString();

      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post',
          content: 'Test content',
          status: 'published',
          published_at: expect.any(String),
        })
      );

      const insertCall = mockFrom.insert.mock.calls[0][0];
      expect(
        new Date(insertCall.published_at).getTime()
      ).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(insertCall.published_at).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime()
      );
    });

    it('should not set published_at when creating a draft post', async () => {
      await createPost({
        title: 'Test Post',
        content: 'Test content',
        status: 'draft',
      });

      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post',
          content: 'Test content',
          status: 'draft',
        })
      );

      const insertCall = mockFrom.insert.mock.calls[0][0];
      expect(insertCall.published_at).toBeUndefined();
    });

    it('should generate slug and excerpt', async () => {
      await createPost({
        title: 'Test Post Title',
        content:
          'This is a very long content that should be truncated for the excerpt. '.repeat(
            10
          ),
        status: 'published',
      });

      const insertCall = mockFrom.insert.mock.calls[0][0];
      expect(insertCall.slug).toMatch(/^test-post-title-[a-z0-9]+-[a-z0-9]+$/);
      expect(insertCall.excerpt.length).toBeLessThanOrEqual(163); // Should be truncated
      expect(insertCall.excerpt.endsWith('...')).toBe(true);
    });
  });

  describe('updatePost', () => {
    it('should set published_at when updating to published status', async () => {
      const beforeTime = new Date().toISOString();

      await updatePost('post-123', {
        title: 'Updated Post',
        content: 'Updated content',
        status: 'published',
      });

      const afterTime = new Date().toISOString();

      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Post',
          content: 'Updated content',
          status: 'published',
          published_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );

      const updateCall = mockFrom.update.mock.calls[0][0];
      expect(
        new Date(updateCall.published_at).getTime()
      ).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(updateCall.published_at).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime()
      );
    });

    it('should not set published_at when updating without changing status', async () => {
      await updatePost('post-123', {
        title: 'Updated Post',
        content: 'Updated content',
      });

      const updateCall = mockFrom.update.mock.calls[0][0];
      expect(updateCall.published_at).toBeUndefined();
      expect(updateCall.status).toBeUndefined();
    });

    it('should update excerpt when content changes', async () => {
      await updatePost('post-123', {
        content: 'This is new content for the post',
      });

      expect(mockFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'This is new content for the post',
          excerpt: 'This is new content for the post',
          updated_at: expect.any(String),
        })
      );
    });
  });
});
