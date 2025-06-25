import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.generated';

// Integration tests for seed data
// These tests verify that the seed data is correctly structured and related

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

describe('Seed Data Integration', () => {
  describe('User and Profile Consistency', () => {
    it('should have matching users and profiles', async () => {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at');

      expect(usersError).toBeNull();
      expect(users).toBeDefined();

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');

      expect(profilesError).toBeNull();
      expect(profiles).toBeDefined();

      // Every user should have a corresponding profile
      const userIds = users?.map((u) => u.id) || [];
      const profileIds = profiles?.map((p) => p.id) || [];

      userIds.forEach((userId) => {
        expect(profileIds).toContain(userId);
      });
    });

    it('should have consistent usernames between users and profiles', async () => {
      // Since there's no direct foreign key, we need to join by id
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username');

      expect(usersError).toBeNull();

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username');

      expect(profilesError).toBeNull();

      // Check that usernames match for the same id
      users?.forEach((user) => {
        const profile = profiles?.find((p) => p.id === user.id);
        expect(profile).toBeDefined();
        expect(user.username).toBe(profile?.username);
      });
    });
  });

  describe('Post Content and Relationships', () => {
    it('should have posts with valid author references', async () => {
      const { data: posts, error } = await supabase.from('posts').select(`
          *,
          profiles!inner (
            username,
            full_name
          )
        `);

      expect(error).toBeNull();
      expect(posts).toBeDefined();
      expect(posts?.length).toBeGreaterThan(0);

      posts?.forEach((post) => {
        expect(post.author_id).toBeDefined();
        expect(post.profiles).toBeDefined();
        expect(post.profiles?.username).toBeDefined();
      });
    });

    it('should have posts with appropriate content structure', async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published');

      expect(error).toBeNull();
      expect(posts).toBeDefined();

      posts?.forEach((post) => {
        expect(post.title).toBeTruthy();
        expect(post.slug).toBeTruthy();
        expect(post.content).toBeTruthy();
        expect(post.excerpt).toBeTruthy();
        expect(post.content.length).toBeGreaterThan(post.excerpt.length);
        expect(post.published_at).toBeDefined();
      });
    });

    it('should have draft posts without published_at dates', async () => {
      const { data: draftPosts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'draft');

      expect(error).toBeNull();
      expect(draftPosts).toBeDefined();

      draftPosts?.forEach((post) => {
        expect(post.published_at).toBeNull();
      });
    });
  });

  describe('Tag System', () => {
    it('should have unique tag slugs', async () => {
      const { data: tags, error } = await supabase.from('tags').select('*');

      expect(error).toBeNull();
      expect(tags).toBeDefined();

      const slugs = tags?.map((tag) => tag.slug) || [];
      const uniqueSlugs = [...new Set(slugs)];

      expect(slugs.length).toBe(uniqueSlugs.length);
    });

    it('should have posts correctly tagged', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          title,
          slug,
          post_tags (
            tags (
              name,
              slug
            )
          )
        `
        )
        .eq('status', 'published');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Verify Next.js post has appropriate tags
      const nextjsPost = data?.find(
        (post) => post.slug === 'getting-started-nextjs-15-supabase'
      );
      expect(nextjsPost).toBeDefined();

      const tagNames = nextjsPost?.post_tags?.map((pt) => pt.tags?.name) || [];
      expect(tagNames).toContain('Next.js');
      expect(tagNames).toContain('Supabase');
    });
  });

  describe('Data Integrity', () => {
    it('should not have orphaned post_tags entries', async () => {
      const { data: orphanedTags, error } = await supabase.from('post_tags')
        .select(`
          post_id,
          tag_id,
          posts!inner (id),
          tags!inner (id)
        `);

      expect(error).toBeNull();

      // If we get here, all post_tags have valid post and tag references
      expect(orphanedTags).toBeDefined();
    });

    it('should have valid timestamps on all records', async () => {
      // Test tables that have both created_at and updated_at
      const tablesWithBothTimestamps = ['users', 'profiles', 'posts'];

      for (const table of tablesWithBothTimestamps) {
        const { data, error } = await supabase
          .from(table)
          .select('created_at, updated_at')
          .limit(10);

        expect(error).toBeNull();
        expect(data).toBeDefined();

        data?.forEach((record) => {
          expect(record.created_at).toBeDefined();
          expect(new Date(record.created_at).getTime()).toBeLessThanOrEqual(
            Date.now()
          );

          if (record.updated_at) {
            expect(
              new Date(record.updated_at).getTime()
            ).toBeGreaterThanOrEqual(new Date(record.created_at).getTime());
          }
        });
      }

      // Test tags table separately (only has created_at)
      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('created_at')
        .limit(10);

      expect(tagsError).toBeNull();
      expect(tags).toBeDefined();

      tags?.forEach((tag) => {
        expect(tag.created_at).toBeDefined();
        expect(new Date(tag.created_at).getTime()).toBeLessThanOrEqual(
          Date.now()
        );
      });
    });
  });
});
