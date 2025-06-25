import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Mock Supabase client for testing
const supabaseUrl =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'http://localhost:54321';
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'test-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

describe('Posts Table', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password',
      email_confirm: true,
    });

    if (error) throw error;
    testUserId = user.user.id;
  });

  afterEach(async () => {
    // Clean up test user (posts will cascade delete)
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Post Creation', () => {
    it('should create a post with automatic slug generation', async () => {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          title: 'My First Post!',
          content: 'This is the content of my first post.',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(post).toBeDefined();
      expect(post?.slug).toBe('my-first-post');
      expect(post?.previous_post_archived_at).toBeNull();
    });

    it('should handle special characters in slug generation', async () => {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          title: 'Test @ Post #1 - Special & Characters!',
          content: 'Testing slug generation',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(post?.slug).toBe('test-post-1-special-characters');
    });

    it('should allow custom slug if provided', async () => {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          title: 'Custom Slug Post',
          content: 'This post has a custom slug',
          slug: 'my-custom-slug',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(post?.slug).toBe('my-custom-slug');
    });
  });

  describe('Post Replacement Logic', () => {
    it('should archive previous post when creating a new one', async () => {
      // Create first post
      const { data: firstPost } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          title: 'First Post',
          content: 'First content',
        })
        .select()
        .single();

      // Create second post
      const { data: secondPost } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          title: 'Second Post',
          content: 'Second content',
        })
        .select()
        .single();

      // Check that first post is archived
      const { data: archivedPost } = await supabase
        .from('posts')
        .select()
        .eq('id', firstPost?.id)
        .single();

      expect(archivedPost?.previous_post_archived_at).not.toBeNull();
      expect(secondPost?.previous_post_archived_at).toBeNull();
    });

    it('should allow only one active post per user', async () => {
      // Create multiple posts
      for (let i = 0; i < 3; i++) {
        await supabase.from('posts').insert({
          user_id: testUserId,
          title: `Post ${i + 1}`,
          content: `Content ${i + 1}`,
        });
      }

      // Check active posts count
      const { data: activePosts } = await supabase
        .from('posts')
        .select()
        .eq('user_id', testUserId)
        .is('previous_post_archived_at', null);

      expect(activePosts?.length).toBe(1);
      expect(activePosts?.[0]?.title).toBe('Post 3');
    });

    it('should maintain post history', async () => {
      // Create multiple posts
      const titles = ['First', 'Second', 'Third'];
      for (const title of titles) {
        await supabase.from('posts').insert({
          user_id: testUserId,
          title: `${title} Post`,
          content: `${title} content`,
        });
      }

      // Get all posts for user
      const { data: allPosts } = await supabase
        .from('posts')
        .select()
        .eq('user_id', testUserId)
        .order('created_at', { ascending: true });

      expect(allPosts?.length).toBe(3);
      expect(
        allPosts?.filter((p) => p.previous_post_archived_at === null).length
      ).toBe(1);
    });
  });

  describe('Cascade Delete', () => {
    it('should delete posts when user is deleted', async () => {
      // Create a post
      await supabase.from('posts').insert({
        user_id: testUserId,
        title: 'Post to be deleted',
        content: 'This will be cascade deleted',
      });

      // Delete the user
      await supabase.auth.admin.deleteUser(testUserId);

      // Check that posts are deleted
      const { data: posts } = await supabase
        .from('posts')
        .select()
        .eq('user_id', testUserId);

      expect(posts?.length).toBe(0);

      // Mark user as deleted so afterEach doesn't try to delete again
      testUserId = '';
    });
  });

  describe('Helper Functions', () => {
    it('should get active post for user', async () => {
      // Create multiple posts
      await supabase.from('posts').insert({
        user_id: testUserId,
        title: 'Old Post',
        content: 'Old content',
      });

      await supabase.from('posts').insert({
        user_id: testUserId,
        title: 'Active Post',
        content: 'Active content',
      });

      // Use helper function
      const { data: activePost } = await supabase.rpc('get_active_post', {
        p_user_id: testUserId,
      });

      expect(activePost).toBeDefined();
      if (activePost && 'title' in activePost && 'content' in activePost) {
        expect(activePost.title).toBe('Active Post');
        expect(activePost.content).toBe('Active content');
      }
    });
  });

  describe('Slug Uniqueness', () => {
    it('should ensure slug uniqueness across users', async () => {
      // Create second test user
      const { data: user2 } = await supabase.auth.admin.createUser({
        email: `test2-${Date.now()}@example.com`,
        password: 'test-password',
        email_confirm: true,
      });

      if (!user2.user) throw new Error('Failed to create second user');
      const testUserId2 = user2.user.id;

      // Create post with first user
      await supabase.from('posts').insert({
        user_id: testUserId,
        title: 'Duplicate Title',
        content: 'First user content',
      });

      // Try to create post with same title for second user
      const { data: post2, error } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId2,
          title: 'Duplicate Title',
          content: 'Second user content',
        })
        .select()
        .single();

      // Should append timestamp to make it unique
      expect(error).toBeNull();
      expect(post2?.slug).toMatch(/^duplicate-title-\d+$/);

      // Clean up second user
      await supabase.auth.admin.deleteUser(testUserId2);
    });
  });
});
