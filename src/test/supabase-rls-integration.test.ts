import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Integration tests for RLS policies
// These tests require a running Supabase instance with the migrations applied

// Skip these tests in CI environment where Supabase may not be available
const skipInCI = process.env['CI'] === 'true';

describe.skipIf(skipInCI)(
  'RLS Integration Tests for Profiles and Posts',
  () => {
    let supabaseUrl: string;
    let supabaseAnonKey: string;
    let supabaseServiceKey: string;

    let adminClient: SupabaseClient;
    let anonClient: SupabaseClient;
    let user1Client: SupabaseClient;
    let user2Client: SupabaseClient;

    let user1Id: string;
    let user2Id: string;
    let user1Token: string;
    let user2Token: string;

    beforeAll(async () => {
      // Get environment variables
      supabaseUrl =
        process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'http://localhost:54321';
      supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';
      supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';

      if (!supabaseAnonKey || !supabaseServiceKey) {
        console.warn(
          'Skipping RLS integration tests: Supabase keys not configured'
        );
        return;
      }

      // Create clients
      adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });

      anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      // Create test users
      const { data: user1Auth, error: user1Error } =
        await adminClient.auth.admin.createUser({
          email: 'test-user1@example.com',
          password: 'test-password-123',
          email_confirm: true,
          user_metadata: { username: 'testuser1' },
        });

      if (user1Error) throw user1Error;
      user1Id = user1Auth.user.id;

      const { data: user2Auth, error: user2Error } =
        await adminClient.auth.admin.createUser({
          email: 'test-user2@example.com',
          password: 'test-password-123',
          email_confirm: true,
          user_metadata: { username: 'testuser2' },
        });

      if (user2Error) throw user2Error;
      user2Id = user2Auth.user.id;

      // Sign in users to get tokens
      const { data: session1, error: session1Error } =
        await anonClient.auth.signInWithPassword({
          email: 'test-user1@example.com',
          password: 'test-password-123',
        });

      if (session1Error) throw session1Error;
      user1Token = session1.session?.access_token || '';

      const { data: session2, error: session2Error } =
        await anonClient.auth.signInWithPassword({
          email: 'test-user2@example.com',
          password: 'test-password-123',
        });

      if (session2Error) throw session2Error;
      user2Token = session2.session?.access_token || '';

      // Create authenticated clients
      user1Client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${user1Token}` },
        },
      });

      user2Client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${user2Token}` },
        },
      });

      // Create profiles for test users
      await adminClient.from('profiles').insert([
        { id: user1Id, username: 'testuser1', full_name: 'Test User 1' },
        { id: user2Id, username: 'testuser2', full_name: 'Test User 2' },
      ]);
    });

    afterAll(async () => {
      if (!supabaseServiceKey) return;

      // Clean up test data
      await adminClient
        .from('posts')
        .delete()
        .in('author_id', [user1Id, user2Id]);
      await adminClient.from('profiles').delete().in('id', [user1Id, user2Id]);
      await adminClient.auth.admin.deleteUser(user1Id);
      await adminClient.auth.admin.deleteUser(user2Id);
    });

    describe('Profiles Table RLS Policies', () => {
      it('should allow authenticated users to read all profiles', async () => {
        const { data, error } = await user1Client
          .from('profiles')
          .select('*')
          .order('username');

        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThanOrEqual(2);
        expect(data?.some((p) => p.username === 'testuser1')).toBe(true);
        expect(data?.some((p) => p.username === 'testuser2')).toBe(true);
      });

      it('should NOT allow anonymous users to read profiles', async () => {
        const { data, error } = await anonClient.from('profiles').select('*');

        expect(error).toBeTruthy();
        expect(data).toHaveLength(0);
      });

      it('should allow users to update only their own profile', async () => {
        const { data, error } = await user1Client
          .from('profiles')
          .update({ bio: 'Updated bio for user 1' })
          .eq('id', user1Id)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.bio).toBe('Updated bio for user 1');
      });

      it('should NOT allow users to update other profiles', async () => {
        const { data, error } = await user1Client
          .from('profiles')
          .update({ bio: 'Hacked bio' })
          .eq('id', user2Id)
          .select();

        expect(error).toBeTruthy();
        expect(data).toHaveLength(0);
      });
    });

    describe('Posts Table RLS Policies', () => {
      let publishedPostId: string;
      let draftPostId: string;

      beforeAll(async () => {
        // Create test posts
        const { data: published } = await adminClient
          .from('posts')
          .insert({
            author_id: user1Id,
            title: 'Published Post',
            content: 'This is a published post',
            slug: 'published-post-test',
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        publishedPostId = published?.id;

        const { data: draft } = await adminClient
          .from('posts')
          .insert({
            author_id: user1Id,
            title: 'Draft Post',
            content: 'This is a draft post',
            slug: 'draft-post-test',
            status: 'draft',
          })
          .select()
          .single();

        draftPostId = draft?.id;
      });

      it('should allow public to read ONLY published posts', async () => {
        const { data, error } = await anonClient
          .from('posts')
          .select('*')
          .order('created_at');

        expect(error).toBeNull();
        expect(data?.every((post) => post.status === 'published')).toBe(true);
        expect(data?.some((post) => post.id === publishedPostId)).toBe(true);
        expect(data?.some((post) => post.id === draftPostId)).toBe(false);
      });

      it('should allow authors to view all their own posts including drafts', async () => {
        const { data, error } = await user1Client
          .from('posts')
          .select('*')
          .eq('author_id', user1Id)
          .order('created_at');

        expect(error).toBeNull();
        expect(data?.some((post) => post.id === publishedPostId)).toBe(true);
        expect(data?.some((post) => post.id === draftPostId)).toBe(true);
      });

      it('should allow users to create posts with their own author_id', async () => {
        const { data, error } = await user2Client
          .from('posts')
          .insert({
            author_id: user2Id,
            title: 'New Post by User 2',
            content: 'Content',
            slug: 'new-post-user2-test',
            status: 'draft',
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.author_id).toBe(user2Id);
        expect(data?.title).toBe('New Post by User 2');

        // Clean up
        if (data?.id) {
          await adminClient.from('posts').delete().eq('id', data.id);
        }
      });

      it('should NOT allow users to create posts with another author_id', async () => {
        const { data, error } = await user1Client
          .from('posts')
          .insert({
            author_id: user2Id, // Trying to create post as another user
            title: 'Fake Post',
            content: 'Should fail',
            slug: 'fake-post-test',
            status: 'draft',
          })
          .select();

        expect(error).toBeTruthy();
        expect(data).toHaveLength(0);
      });

      it('should allow users to update only their own posts', async () => {
        const { data, error } = await user1Client
          .from('posts')
          .update({ title: 'Updated Title' })
          .eq('id', publishedPostId)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.title).toBe('Updated Title');
      });

      it('should NOT allow users to update posts by other authors', async () => {
        const { data, error } = await user2Client
          .from('posts')
          .update({ title: 'Hacked Title' })
          .eq('id', publishedPostId)
          .select();

        expect(error).toBeTruthy();
        expect(data).toHaveLength(0);
      });

      it('should allow users to delete only their own posts', async () => {
        // Create a post to delete
        const { data: postToDelete } = await adminClient
          .from('posts')
          .insert({
            author_id: user1Id,
            title: 'Post to Delete',
            content: 'Will be deleted',
            slug: 'post-to-delete-test',
            status: 'draft',
          })
          .select()
          .single();

        const { error } = await user1Client
          .from('posts')
          .delete()
          .eq('id', postToDelete?.id);

        expect(error).toBeNull();

        // Verify deletion
        const { data: checkDeleted } = await adminClient
          .from('posts')
          .select('*')
          .eq('id', postToDelete?.id)
          .single();

        expect(checkDeleted).toBeNull();
      });

      it('should NOT allow users to delete posts by other authors', async () => {
        await user2Client.from('posts').delete().eq('id', publishedPostId);

        // In Supabase, RLS prevents the delete but doesn't always return an error
        // Check that the post still exists
        const { data: stillExists } = await adminClient
          .from('posts')
          .select('*')
          .eq('id', publishedPostId)
          .single();

        expect(stillExists).toBeTruthy();
      });
    });

    describe('Service Role Access', () => {
      it('should allow service role full access to profiles', async () => {
        // Test insert
        const { data: inserted, error: insertError } = await adminClient
          .from('profiles')
          .insert({
            id: '00000000-0000-0000-0000-000000000001',
            username: 'service-test-user',
            full_name: 'Service Test',
          })
          .select()
          .single();

        expect(insertError).toBeNull();
        expect(inserted?.username).toBe('service-test-user');

        // Test update
        const { error: updateError } = await adminClient
          .from('profiles')
          .update({ bio: 'Updated by service role' })
          .eq('id', '00000000-0000-0000-0000-000000000001');

        expect(updateError).toBeNull();

        // Test delete
        const { error: deleteError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000001');

        expect(deleteError).toBeNull();
      });

      it('should allow service role full access to posts', async () => {
        // Service role can perform all operations
        const { data, error } = await adminClient.from('posts').select('*');

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });
    });
  }
);
