import { test, expect } from '@playwright/test';
import { testFixtures, signInUser } from './test-helpers/test-data';

test.describe('Example Tests with Fixtures', () => {
  test('user can edit their own post', async ({ page }) => {
    // Create a user with a post
    const fixture = await testFixtures.userWithPost();

    try {
      // Sign in as the user
      await signInUser(page, fixture.user.email, fixture.user.password);

      // Navigate to the post
      await page.goto('/');
      await page.click(`text="${fixture.post.title}"`);

      // Look for edit button
      const editButton = page.locator(
        'button:has-text("Edit"), a:has-text("Edit")'
      );
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Update the post
      const newTitle = `Updated: ${fixture.post.title}`;
      await page.fill('input[value*="' + fixture.post.title + '"]', newTitle);
      await page.click('button:has-text("Update Post")');

      // Verify update
      await page.waitForURL('/');
      await expect(page.locator(`text="${newTitle}"`)).toBeVisible();
    } finally {
      // Clean up
      await fixture.cleanup();
    }
  });

  test('multiple users can have posts', async ({ browser }) => {
    // Create multiple users with posts
    const user1Fixture = await testFixtures.userWithPost();
    const user2Fixture = await testFixtures.userWithPost();

    try {
      // Create two browser contexts for different users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Sign in both users
      await signInUser(
        page1,
        user1Fixture.user.email,
        user1Fixture.user.password
      );
      await signInUser(
        page2,
        user2Fixture.user.email,
        user2Fixture.user.password
      );

      // Both users should see their own posts on the home page
      await page1.goto('/');
      await page2.goto('/');

      // User 1 should see their post
      await expect(
        page1.locator(`text="${user1Fixture.post.title}"`)
      ).toBeVisible();

      // User 2 should see their post
      await expect(
        page2.locator(`text="${user2Fixture.post.title}"`)
      ).toBeVisible();

      // Clean up contexts
      await context1.close();
      await context2.close();
    } finally {
      // Clean up test data
      await user1Fixture.cleanup();
      await user2Fixture.cleanup();
    }
  });

  test('user with multiple posts sees all their posts', async ({ page }) => {
    // Create a user with multiple posts
    const fixture = await testFixtures.userWithMultiplePosts(3);

    try {
      // Sign in as the user
      await signInUser(page, fixture.user.email, fixture.user.password);

      // Navigate to user profile or home
      await page.goto('/');

      // Verify all posts are visible
      for (const post of fixture.posts) {
        await expect(page.locator(`text="${post.title}"`)).toBeVisible();
      }

      // Check post count if there's a counter
      const postCount = page.locator('text=/\\d+ posts?/i');
      if (await postCount.isVisible()) {
        await expect(postCount).toContainText('3 posts');
      }
    } finally {
      // Clean up
      await fixture.cleanup();
    }
  });

  test("user cannot edit another user's post", async ({ page }) => {
    // Create two users with posts
    const user1Fixture = await testFixtures.userWithPost();
    const user2Fixture = await testFixtures.userWithPost();

    try {
      // Sign in as user 2
      await signInUser(
        page,
        user2Fixture.user.email,
        user2Fixture.user.password
      );

      // Try to navigate to user 1's post
      await page.goto('/');

      // Check if user 1's post is visible
      const user1Post = page.locator(`text="${user1Fixture.post.title}"`);
      if (await user1Post.isVisible()) {
        await user1Post.click();

        // Edit button should not be visible for another user's post
        const editButton = page.locator(
          'button:has-text("Edit"), a:has-text("Edit")'
        );
        await expect(editButton).not.toBeVisible();
      }
    } finally {
      // Clean up
      await user1Fixture.cleanup();
      await user2Fixture.cleanup();
    }
  });

  test('cleanup orphaned test data', async ({ page }) => {
    // This test demonstrates manual cleanup
    // Useful for cleaning up after failed tests

    const { cleanupTestUsers, cleanupTestPosts } = await import(
      './test-helpers/test-data'
    );

    // Clean up any test data that might have been left behind
    await cleanupTestUsers();
    await cleanupTestPosts();

    // Verify cleanup by going to home page
    await page.goto('/');

    // No test posts should be visible
    const testPosts = page.locator('text=/Test Post \\d+/');
    await expect(testPosts).toHaveCount(0);
  });
});

// Example of using test.afterEach for cleanup
test.describe('Tests with automatic cleanup', () => {
  let fixture: Awaited<ReturnType<typeof testFixtures.userWithPost>> | null =
    null;

  test.afterEach(async () => {
    // Clean up any fixtures created during the test
    if (fixture && fixture.cleanup) {
      await fixture.cleanup();
      fixture = null;
    }
  });

  test('example with automatic cleanup', async ({ page }) => {
    // Create fixture
    fixture = await testFixtures.userWithPost();

    // Run test
    await signInUser(page, fixture.user.email, fixture.user.password);
    await page.goto('/');
    await expect(page.locator(`text="${fixture.post.title}"`)).toBeVisible();

    // Cleanup happens automatically in afterEach
  });
});
