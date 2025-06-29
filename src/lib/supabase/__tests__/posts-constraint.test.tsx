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

describe('posts constraint validation', () => {
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

  describe('published_date_consistency constraint', () => {
    it('should never violate published_date_consistency constraint', async () => {
      // With our fix, published posts will always have published_at set
      await createPost({
        title: 'Test Post',
        content: 'Test content',
        status: 'published',
      });

      const insertCall = mockFrom.insert.mock.calls[0][0];
      // Verify that published_at is set when status is published
      expect(insertCall.status).toBe('published');
      expect(insertCall.published_at).toBeDefined();
      expect(insertCall.published_at).not.toBeNull();
    });

    it('should set published_at to current timestamp when creating a published post', async () => {
      const beforeTime = Date.now();

      await createPost({
        title: 'Test Post',
        content: 'Test content',
        status: 'published',
      });

      const afterTime = Date.now();

      const insertCall = mockFrom.insert.mock.calls[0][0];
      expect(insertCall.published_at).toBeDefined();

      const publishedTime = new Date(insertCall.published_at).getTime();
      expect(publishedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(publishedTime).toBeLessThanOrEqual(afterTime);
    });

    it('should preserve existing published_at when updating other fields of a published post', async () => {
      // First, get the existing post data
      const existingPublishedAt = '2024-01-01T00:00:00Z';

      // Mock getting existing post data
      const mockFromForGet = {
        select: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      mockFromForGet.select.mockReturnValue(mockFromForGet);
      mockFromForGet.eq.mockReturnValue(mockFromForGet);
      mockFromForGet.single.mockResolvedValue({
        data: {
          id: 'post-123',
          status: 'published',
          published_at: existingPublishedAt,
        },
        error: null,
      });

      // Update only the title
      await updatePost('post-123', {
        title: 'Updated Title',
      });

      const updateCall = mockFrom.update.mock.calls[0][0];
      // Should not include published_at in the update
      expect(updateCall.published_at).toBeUndefined();
    });

    it('should set published_at when changing status from draft to published', async () => {
      const beforeTime = Date.now();

      await updatePost('post-123', {
        status: 'published',
      });

      const afterTime = Date.now();

      const updateCall = mockFrom.update.mock.calls[0][0];
      expect(updateCall.published_at).toBeDefined();

      const publishedTime = new Date(updateCall.published_at).getTime();
      expect(publishedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(publishedTime).toBeLessThanOrEqual(afterTime);
    });

    it('should clear published_at when changing status from published to draft', async () => {
      await updatePost('post-123', {
        status: 'draft',
      });

      const updateCall = mockFrom.update.mock.calls[0][0];
      expect(updateCall.published_at).toBeNull();
    });

    it('should clear published_at when changing status to archived', async () => {
      await updatePost('post-123', {
        status: 'archived',
      });

      const updateCall = mockFrom.update.mock.calls[0][0];
      expect(updateCall.published_at).toBeNull();
    });
  });
});
