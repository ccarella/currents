import { createClient } from '@supabase/supabase-js';
import { Page } from '@playwright/test';

interface TestUser {
  email: string;
  username: string;
  password: string;
  id?: string;
}

interface TestPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_id: string;
  status: string;
}

// Test environment configuration
const supabaseUrl =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'http://localhost:54321';
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';

// Create Supabase clients
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test data generators
export function generateTestUser() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  return {
    email: `test.user.${timestamp}.${randomId}@example.com`,
    username: `testuser${timestamp}${randomId}`,
    password: 'TestPassword123!',
  };
}

export function generateTestPost() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);

  return {
    title: `Test Post ${timestamp} ${randomId}`,
    content: `This is test content for post ${timestamp}. It contains enough text to be meaningful and test various scenarios.`,
    slug: `test-post-${timestamp}-${randomId}`,
  };
}

// Test data creation utilities
export async function createTestUser(
  userData = generateTestUser()
): Promise<Required<TestUser>> {
  try {
    // Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.username,
        },
      });

    if (authError) throw authError;

    // Profile should be created automatically by trigger
    // Wait a bit for the trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      ...userData,
      id: authData.user.id,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

export async function deleteTestUser(userId: string) {
  try {
    // Delete user (this should cascade to profile)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting test user:', error);
    throw error;
  }
}

export async function createTestPost(
  authorId: string,
  postData = generateTestPost()
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id: authorId,
        title: postData.title,
        content: postData.content,
        slug: postData.slug,
        status: 'published',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating test post:', error);
    throw error;
  }
}

export async function deleteTestPost(postId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting test post:', error);
    throw error;
  }
}

// Browser automation helpers
export async function signInUser(page: Page, email: string, password: string) {
  await page.goto('/auth/sign-in');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

export async function signOutUser(page: Page) {
  // Look for sign out button - adjust selector based on your UI
  const signOutButton = page.locator(
    'button:has-text("Sign out"), a:has-text("Sign out"), button:has-text("Logout"), a:has-text("Logout")'
  );

  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL('/auth/sign-in', { timeout: 5000 }).catch(() => {
      // If no redirect, that's fine
    });
  }
}

// Test data cleanup utilities
export async function cleanupTestUsers(emailPattern: string = 'test.user.') {
  try {
    // Get all test users
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .like('email', `%${emailPattern}%`);

    if (profileError) throw profileError;

    if (profiles && profiles.length > 0) {
      // Delete each test user
      for (const profile of profiles) {
        await deleteTestUser(profile.id);
      }

      // Cleaned up test users
    }
  } catch {
    // Error cleaning up test users
  }
}

export async function cleanupTestPosts(titlePattern: string = 'Test Post') {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('id')
      .like('title', `%${titlePattern}%`);

    if (error) throw error;

    if (posts && posts.length > 0) {
      const postIds = posts.map((post) => post.id);

      const { error: deleteError } = await supabaseAdmin
        .from('posts')
        .delete()
        .in('id', postIds);

      if (deleteError) throw deleteError;

      // Cleaned up test posts
    }
  } catch {
    // Error cleaning up test posts
  }
}

// Test fixtures for common scenarios
export const testFixtures = {
  // User with a published post
  async userWithPost() {
    const userData = generateTestUser();
    const user = await createTestUser(userData);
    const post = await createTestPost(user.id);

    return {
      user: { ...userData, id: user.id },
      post,
      cleanup: async () => {
        await deleteTestPost(post.id);
        await deleteTestUser(user.id);
      },
    };
  },

  // Multiple users
  async multipleUsers(count: number = 3) {
    const users: Required<TestUser>[] = [];

    for (let i = 0; i < count; i++) {
      const user = await createTestUser();
      users.push(user);
    }

    return {
      users,
      cleanup: async () => {
        for (const user of users) {
          await deleteTestUser(user.id);
        }
      },
    };
  },

  // User with multiple posts
  async userWithMultiplePosts(postCount: number = 3) {
    const userData = generateTestUser();
    const user = await createTestUser(userData);
    const posts: TestPost[] = [];

    for (let i = 0; i < postCount; i++) {
      const post = await createTestPost(user.id);
      posts.push(post);
    }

    return {
      user: { ...userData, id: user.id },
      posts,
      cleanup: async () => {
        for (const post of posts) {
          await deleteTestPost(post.id);
        }
        await deleteTestUser(user.id);
      },
    };
  },
};

// Global test setup and teardown
export async function globalTestSetup() {
  // Setting up test environment...

  // Clean up any leftover test data
  await cleanupTestUsers();
  await cleanupTestPosts();

  // Create a default test user that tests can use
  const defaultUser = await createTestUser({
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123',
  });

  return { defaultUser };
}

export async function globalTestTeardown() {
  // Tearing down test environment...

  // Clean up all test data
  await cleanupTestUsers();
  await cleanupTestPosts();
}

// Utility to wait for Supabase operations
export async function waitForSupabase(ms: number = 1000) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
