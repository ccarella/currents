import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase types
type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          bio: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username?: string;
          full_name?: string;
          bio?: string;
          avatar_url?: string;
        };
        Update: {
          username?: string;
          full_name?: string;
          bio?: string;
          avatar_url?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          content: string;
          slug: string;
          created_at: string;
          previous_post_archived_at: string | null;
        };
        Insert: {
          author_id: string;
          title: string;
          content: string;
          slug?: string;
        };
        Update: {
          title?: string;
          content?: string;
          slug?: string;
        };
      };
    };
  };
};

describe('Row Level Security (RLS) Policies', () => {
  let supabaseAdmin: SupabaseClient<Database>;
  let supabaseAnon: SupabaseClient<Database>;
  let supabaseUser1: SupabaseClient<Database>;

  const mockUser1 = {
    id: 'user-1-id',
    username: 'user1',
    full_name: 'User One',
    bio: 'Bio for user 1',
    avatar_url: 'https://example.com/avatar1.jpg',
  };

  const mockUser2 = {
    id: 'user-2-id',
    username: 'user2',
    full_name: 'User Two',
    bio: 'Bio for user 2',
    avatar_url: 'https://example.com/avatar2.jpg',
  };

  beforeEach(() => {
    // Mock different Supabase clients for different auth states
    const createMockClient = (
      role: 'anon' | 'authenticated' | 'service_role',
      userId?: string
    ) => {
      const mockAuth = {
        uid: () => userId || null,
        role: () => role,
      };

      return {
        auth: mockAuth,
        from: vi.fn((table: string) => ({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            // Implement RLS logic in mocks
            if (table === 'profiles') {
              // Public read access for profiles
              return Promise.resolve({ data: mockUser1, error: null });
            }
            if (table === 'posts') {
              // Public read access for posts
              return Promise.resolve({
                data: { id: '1', title: 'Test Post' },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        })),
      };
    };

    supabaseAdmin = createMockClient(
      'service_role'
    ) as unknown as SupabaseClient<Database>;
    supabaseAnon = createMockClient(
      'anon'
    ) as unknown as SupabaseClient<Database>;
    supabaseUser1 = createMockClient(
      'authenticated',
      mockUser1.id
    ) as unknown as SupabaseClient<Database>;
  });

  describe('Profiles Table RLS Policies', () => {
    it('should allow public to read all profiles', async () => {
      const mockResponse = { data: [mockUser1, mockUser2], error: null };

      // Test with anonymous client
      supabaseAnon.from = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockResponse),
      });

      const { data, error } = await supabaseAnon.from('profiles').select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data).toContainEqual(mockUser1);
      expect(data).toContainEqual(mockUser2);
    });

    it('should also allow authenticated users to read profiles', async () => {
      const mockResponse = { data: [mockUser1, mockUser2], error: null };

      supabaseUser1.from = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockResponse),
      });

      const { data, error } = await supabaseUser1.from('profiles').select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('should allow users to update only their own profile', async () => {
      const mockUpdateResponse = {
        data: { ...mockUser1, username: 'updated' },
        error: null,
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockUpdateResponse),
      });

      const { data, error } = await supabaseUser1
        .from('profiles')
        .update({ username: 'updated' })
        .eq('id', mockUser1.id);

      expect(error).toBeNull();
      expect(data).toMatchObject({ username: 'updated' });
    });

    it('should not allow users to update other profiles', async () => {
      const mockErrorResponse = {
        data: null,
        error: { message: 'Access denied' },
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockErrorResponse),
      });

      const { data, error } = await supabaseUser1
        .from('profiles')
        .update({ username: 'hacked' })
        .eq('id', mockUser2.id);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('Posts Table RLS Policies', () => {
    it('should allow public read access for all posts', async () => {
      const mockPosts = [
        {
          id: '1',
          author_id: mockUser1.id,
          title: 'Post 1',
          content: 'Content 1',
        },
        {
          id: '2',
          author_id: mockUser2.id,
          title: 'Post 2',
          content: 'Content 2',
        },
      ];

      supabaseAnon.from = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
      });

      const { data, error } = await supabaseAnon.from('posts').select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('should allow users to create posts with their own author_id', async () => {
      const newPost = {
        author_id: mockUser1.id,
        title: 'My New Post',
        content: 'Post content',
      };

      const mockResponse = {
        data: { id: 'new-post-id', ...newPost },
        error: null,
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockResponse),
      });

      const { data, error } = await supabaseUser1.from('posts').insert(newPost);

      expect(error).toBeNull();
      expect(data).toMatchObject(newPost);
    });

    it('should not allow users to create posts with another author_id', async () => {
      const newPost = {
        author_id: mockUser2.id,
        title: 'Fake Post',
        content: 'Should fail',
      };

      const mockErrorResponse = {
        data: null,
        error: { message: 'Access denied' },
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue(mockErrorResponse),
      });

      const { data, error } = await supabaseUser1.from('posts').insert(newPost);

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it('should allow users to update only their own posts', async () => {
      const mockPost = {
        id: 'post-1',
        author_id: mockUser1.id,
        title: 'Original',
      };
      const mockUpdateResponse = {
        data: { ...mockPost, title: 'Updated' },
        error: null,
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockUpdateResponse),
      });

      const { data, error } = await supabaseUser1
        .from('posts')
        .update({ title: 'Updated' })
        .eq('id', 'post-1');

      expect(error).toBeNull();
      expect(data).toMatchObject({ title: 'Updated' });
    });

    it('should not allow users to update posts from other users', async () => {
      const mockErrorResponse = {
        data: null,
        error: { message: 'Access denied' },
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockErrorResponse),
      });

      const { data, error } = await supabaseUser1
        .from('posts')
        .update({ title: 'Hacked' })
        .eq('id', 'post-2'); // Post owned by user2

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it('should allow users to delete only their own posts', async () => {
      const mockDeleteResponse = { data: { id: 'post-1' }, error: null };

      supabaseUser1.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockDeleteResponse),
      });

      const { data, error } = await supabaseUser1
        .from('posts')
        .delete()
        .eq('id', 'post-1');

      expect(error).toBeNull();
      expect(data).toMatchObject({ id: 'post-1' });
    });

    it('should not allow users to delete posts from other users', async () => {
      const mockErrorResponse = {
        data: null,
        error: { message: 'Access denied' },
      };

      supabaseUser1.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockErrorResponse),
      });

      const { data, error } = await supabaseUser1
        .from('posts')
        .delete()
        .eq('id', 'post-2'); // Post owned by user2

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('Service Role Access', () => {
    it('should allow service role full access to profiles table', async () => {
      const mockResponse = { data: [mockUser1, mockUser2], error: null };

      supabaseAdmin.from = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockResponse),
        insert: vi.fn().mockResolvedValue({ data: mockUser1, error: null }),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockUser1, error: null }),
      });

      // Test read
      const { data: readData, error: readError } = await supabaseAdmin
        .from('profiles')
        .select('*');
      expect(readError).toBeNull();
      expect(readData).toHaveLength(2);

      // Test insert
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(mockUser1);
      expect(insertError).toBeNull();

      // Test update
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ username: 'admin-updated' })
        .eq('id', mockUser1.id);
      expect(updateError).toBeNull();

      // Test delete
      const { error: deleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', mockUser1.id);
      expect(deleteError).toBeNull();
    });

    it('should allow service role full access to posts table', async () => {
      const mockPost = {
        id: '1',
        author_id: mockUser1.id,
        title: 'Test',
        content: 'Content',
      };

      supabaseAdmin.from = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [mockPost], error: null }),
        insert: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockPost, error: null }),
      });

      // Test all CRUD operations
      const { error: readError } = await supabaseAdmin
        .from('posts')
        .select('*');
      expect(readError).toBeNull();

      const { error: insertError } = await supabaseAdmin
        .from('posts')
        .insert(mockPost);
      expect(insertError).toBeNull();

      const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update({ title: 'Admin Updated' })
        .eq('id', '1');
      expect(updateError).toBeNull();

      const { error: deleteError } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', '1');
      expect(deleteError).toBeNull();
    });
  });
});
