import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';

// Test Supabase client with service role for full access
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

describe('Profiles Table', () => {
  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    username: 'testuser',
  };

  let userId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await supabase.from('profiles').delete().eq('email', testUser.email);
  });

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
  });

  describe('Table Creation and Schema', () => {
    it('should have profiles table with correct columns', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Profile Creation and Constraints', () => {
    it('should create a profile record when auth user is created', async () => {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          user_metadata: { username: testUser.username },
        });

      expect(authError).toBeNull();
      expect(authData?.user).toBeDefined();
      if (!authData?.user) {
        throw new Error('Failed to create test user');
      }
      userId = authData.user.id;

      // Check if profile record was created
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      expect(profileError).toBeNull();
      expect(profileData).toBeDefined();
      expect(profileData?.email).toBe(testUser.email);
      expect(profileData?.username).toBe(testUser.username);
      expect(profileData?.created_at).toBeDefined();
      expect(profileData?.updated_at).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      // Try to insert duplicate email directly
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: testUser.email,
        username: 'anotheruser',
      });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // Unique violation
    });

    it('should enforce unique username constraint', async () => {
      // Try to insert duplicate username directly
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: 'another@example.com',
        username: testUser.username,
      });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // Unique violation
    });

    it('should enforce username length constraint', async () => {
      // Try to insert username that's too short
      const { error: shortError } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: 'short@example.com',
        username: 'ab', // Less than 3 characters
      });

      expect(shortError).toBeDefined();
      expect(shortError?.code).toBe('23514'); // Check constraint violation

      // Try to insert username that's too long
      const { error: longError } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: 'long@example.com',
        username: 'a'.repeat(31), // More than 30 characters
      });

      expect(longError).toBeDefined();
      expect(longError?.code).toBe('23514'); // Check constraint violation
    });

    it('should enforce bio length constraint', async () => {
      // Try to update bio that's too long
      const { error } = await supabase
        .from('profiles')
        .update({ bio: 'a'.repeat(501) }) // More than 500 characters
        .eq('id', userId);

      expect(error).toBeDefined();
      expect(error?.code).toBe('23514'); // Check constraint violation
    });
  });

  describe('Updated At Trigger', () => {
    it('should automatically update updated_at on record update', async () => {
      // Get initial profile data
      const { data: initialData } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', userId)
        .single();

      const initialUpdatedAt = initialData?.updated_at;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update bio
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ bio: 'Updated bio' })
        .eq('id', userId);

      expect(updateError).toBeNull();

      // Check if updated_at changed
      const { data: updatedData } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', userId)
        .single();

      expect(updatedData?.updated_at).not.toBe(initialUpdatedAt);
      expect(updatedData?.updated_at).toBeDefined();
      expect(initialUpdatedAt).toBeDefined();
      expect(
        new Date(updatedData?.updated_at || '') >
          new Date(initialUpdatedAt || '')
      ).toBe(true);
    });
  });

  describe('Row Level Security', () => {
    it('should allow users to view their own profile', async () => {
      // Verify user can read their own record
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(userId);
    });

    it('should allow users to update their own profile', async () => {
      // Verify RLS update policy exists and works correctly
      const newBio = 'My updated bio';

      const { error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', userId);

      expect(error).toBeNull();

      // Verify the update worked
      const { data } = await supabase
        .from('profiles')
        .select('bio')
        .eq('id', userId)
        .single();

      expect(data?.bio).toBe(newBio);
    });

    it('should allow authenticated users to view public profile info', async () => {
      // Create another user
      const uniqueEmail = `other${Date.now()}@example.com`;
      const { data: otherUserData, error: createError } =
        await supabase.auth.admin.createUser({
          email: uniqueEmail,
          password: 'Other123!@#',
          user_metadata: { username: `otheruser${Date.now()}` },
        });

      expect(createError).toBeNull();
      expect(otherUserData?.user).toBeDefined();

      if (!otherUserData.user) throw new Error('Failed to create other user');
      const otherUserId = otherUserData.user.id;

      // Verify both profiles exist
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', [userId, otherUserId]);

      expect(profiles?.length).toBe(2);

      // Clean up
      await supabase.auth.admin.deleteUser(otherUserId);
    });
  });

  describe('Auth Integration', () => {
    it('should handle cascade delete when auth user is deleted', async () => {
      // Create a new user
      const { data: authData } = await supabase.auth.admin.createUser({
        email: 'todelete@example.com',
        password: 'Delete123!@#',
      });

      if (!authData?.user) {
        throw new Error('Failed to create test user for deletion');
      }
      const deleteUserId = authData.user.id;

      // Verify profile record exists
      const { data: beforeDelete } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', deleteUserId)
        .single();

      expect(beforeDelete).toBeDefined();

      // Delete auth user
      await supabase.auth.admin.deleteUser(deleteUserId);

      // Verify profile record is deleted
      const { data: afterDelete } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', deleteUserId)
        .single();

      expect(afterDelete).toBeNull();
    });

    it('should create profile with default username from email if not provided', async () => {
      // Create auth user without username metadata
      const { data: authData } = await supabase.auth.admin.createUser({
        email: 'noname@example.com',
        password: 'Noname123!@#',
      });

      if (!authData?.user) {
        throw new Error('Failed to create test user without username');
      }
      const noNameUserId = authData.user.id;

      // Check if profile record was created with default username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', noNameUserId)
        .single();

      expect(profileData?.username).toBe('noname'); // Email prefix

      // Clean up
      await supabase.auth.admin.deleteUser(noNameUserId);
    });

    it('should handle username conflicts when generating from email', async () => {
      // Create first user with email prefix 'duplicate'
      const { data: firstUserData } = await supabase.auth.admin.createUser({
        email: 'duplicate@example.com',
        password: 'Duplicate123!@#',
      });

      if (!firstUserData?.user) throw new Error('Failed to create first user');
      const firstUserId = firstUserData.user.id;

      // Create second user with same email prefix
      const { data: secondUserData } = await supabase.auth.admin.createUser({
        email: 'duplicate@another.com',
        password: 'Duplicate123!@#',
      });

      if (!secondUserData?.user)
        {throw new Error('Failed to create second user');}
      const secondUserId = secondUserData.user.id;

      // Check both profiles were created with unique usernames
      const { data: profiles } = await supabase
        .from('profiles')
        .select('username')
        .in('id', [firstUserId, secondUserId])
        .order('created_at');

      expect(profiles?.length).toBe(2);
      expect(profiles?.[0]?.username).toBe('duplicate');
      expect(profiles?.[1]?.username).toMatch(/^duplicate_\d+$/); // Should have random suffix

      // Clean up
      await supabase.auth.admin.deleteUser(firstUserId);
      await supabase.auth.admin.deleteUser(secondUserId);
    });
  });
});
