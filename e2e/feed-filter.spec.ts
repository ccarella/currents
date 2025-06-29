import { test, expect } from '@playwright/test';
import { createTestUser, createTestPost } from './test-helpers/test-data';

test.describe('Home Feed - Recent Posts Per User', () => {
  test('should display only the most recent post from each user', async ({
    page,
  }) => {
    // Create test users
    const user1 = await createTestUser({
      email: 'user1@test.com',
      password: 'testpass123',
      username: 'testuser1',
      full_name: 'Test User One',
    });

    const user2 = await createTestUser({
      email: 'user2@test.com',
      password: 'testpass123',
      username: 'testuser2',
      full_name: 'Test User Two',
    });

    // Create multiple posts for user1
    await createTestPost({
      author_id: user1.id,
      title: 'User 1 Older Post',
      content: 'This is an older post from user 1',
      status: 'published',
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    });

    await createTestPost({
      author_id: user1.id,
      title: 'User 1 Latest Post',
      content: 'This is the latest post from user 1',
      status: 'published',
      created_at: new Date().toISOString(), // now
    });

    // Create a post for user2
    await createTestPost({
      author_id: user2.id,
      title: 'User 2 Post',
      content: 'This is a post from user 2',
      status: 'published',
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    });

    // Navigate to home page
    await page.goto('/');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]');

    // Get all post titles
    const postTitles = await page.$$eval(
      '[data-testid="post-title"]',
      (elements) => elements.map((el) => el.textContent)
    );

    // Verify only latest posts are shown
    expect(postTitles).toContain('User 1 Latest Post');
    expect(postTitles).toContain('User 2 Post');
    expect(postTitles).not.toContain('User 1 Older Post');

    // Verify only 2 posts are displayed (one per user)
    const postCount = await page.locator('[data-testid="post-card"]').count();
    expect(postCount).toBe(2);
  });

  test('should show all posts on user profile page', async ({ page }) => {
    // Create test user
    const user = await createTestUser({
      email: 'profiletest@test.com',
      password: 'testpass123',
      username: 'profiletestuser',
      full_name: 'Profile Test User',
    });

    // Create multiple posts
    await createTestPost({
      author_id: user.id,
      title: 'First Post',
      content: 'First post content',
      status: 'published',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    });

    await createTestPost({
      author_id: user.id,
      title: 'Second Post',
      content: 'Second post content',
      status: 'published',
      created_at: new Date().toISOString(),
    });

    // Navigate to user profile
    await page.goto(`/@${user.username}`);

    // Wait for profile to load
    await page.waitForSelector('[data-testid="user-profile"]');

    // The profile page should show only the most recent post
    await expect(page.getByText('Second Post')).toBeVisible();
    await expect(page.getByText('Second post content')).toBeVisible();

    // The older post should not be visible on the profile page
    await expect(page.getByText('First Post')).not.toBeVisible();
  });

  test('should handle pagination correctly with filtered posts', async ({
    page,
  }) => {
    // Create 25 test users with posts
    const users = [];
    for (let i = 1; i <= 25; i++) {
      const user = await createTestUser({
        email: `user${i}@test.com`,
        password: 'testpass123',
        username: `testuser${i}`,
        full_name: `Test User ${i}`,
      });

      await createTestPost({
        author_id: user.id,
        title: `Post from User ${i}`,
        content: `Content from user ${i}`,
        status: 'published',
        created_at: new Date(Date.now() - i * 60000).toISOString(), // Stagger creation times
      });

      users.push(user);
    }

    // Navigate to home page
    await page.goto('/');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]');

    // Count initial posts (should be 20 due to pagination)
    const initialPostCount = await page
      .locator('[data-testid="post-card"]')
      .count();
    expect(initialPostCount).toBe(20);

    // Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for more posts to load
    await page.waitForTimeout(1000);

    // Count posts after scroll (should be 25 total)
    const finalPostCount = await page
      .locator('[data-testid="post-card"]')
      .count();
    expect(finalPostCount).toBe(25);
  });

  test('should not show draft or archived posts', async ({ page }) => {
    const user = await createTestUser({
      email: 'drafts@test.com',
      password: 'testpass123',
      username: 'draftuser',
      full_name: 'Draft Test User',
    });

    // Create posts with different statuses
    await createTestPost({
      author_id: user.id,
      title: 'Published Post',
      content: 'This post is published',
      status: 'published',
    });

    await createTestPost({
      author_id: user.id,
      title: 'Draft Post',
      content: 'This post is a draft',
      status: 'draft',
    });

    await createTestPost({
      author_id: user.id,
      title: 'Archived Post',
      content: 'This post is archived',
      status: 'archived',
    });

    // Navigate to home page
    await page.goto('/');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]');

    // Verify only published post is shown
    await expect(page.getByText('Published Post')).toBeVisible();
    await expect(page.getByText('Draft Post')).not.toBeVisible();
    await expect(page.getByText('Archived Post')).not.toBeVisible();
  });
});
