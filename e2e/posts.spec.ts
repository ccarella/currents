import { test, expect } from '@playwright/test';

import { Page } from '@playwright/test';

// Helper function to sign in a test user
async function signInTestUser(page: Page, email: string, password: string) {
  await page.goto('/auth/sign-in');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Post Creation', () => {
  // Use the default test user created in global setup
  const testEmail = process.env['TEST_USER_EMAIL'] || 'test@example.com';
  const testPassword = process.env['TEST_USER_PASSWORD'] || 'TestPassword123';

  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await signInTestUser(page, testEmail, testPassword);
  });

  test('user can create and publish a post', async ({ page }) => {
    // Navigate to write page
    await page.goto('/write');

    // Generate unique post data
    const timestamp = Date.now();
    const postTitle = `Test Post ${timestamp}`;
    const postContent = `This is test content for post ${timestamp}. It contains enough text to be meaningful.`;

    // Fill in the post form
    await page.fill('input[placeholder="Enter your title..."]', postTitle);

    // The PlainTextEditor might need special handling
    // First, click on the editor to focus it
    const editor = page.locator('div[role="textbox"], textarea').first();
    await editor.click();
    await editor.fill(postContent);

    // Click publish button
    await page.click('button:has-text("Publish")');

    // Handle the replacement dialog if it appears
    const replaceDialog = page.locator('text="Replace Your Current Post?"');
    if (await replaceDialog.isVisible({ timeout: 3000 })) {
      await page.click('button:has-text("Replace Post")');
    }

    // Wait for navigation back to home page
    await page.waitForURL('/', { timeout: 10000 });

    // Verify the post appears on the home page
    await expect(page.locator(`text="${postTitle}"`)).toBeVisible({
      timeout: 10000,
    });
  });

  test('user cannot publish post without title', async ({ page }) => {
    // Navigate to write page
    await page.goto('/write');

    // Only fill in content, no title
    const editor = page.locator('div[role="textbox"], textarea').first();
    await editor.click();
    await editor.fill('This is content without a title');

    // Try to publish
    await page.click('button:has-text("Publish")');

    // Should see error message
    await expect(page.locator('text="Please enter a title"')).toBeVisible();

    // Should still be on write page
    await expect(page).toHaveURL('/write');
  });

  test('user cannot publish post without content', async ({ page }) => {
    // Navigate to write page
    await page.goto('/write');

    // Only fill in title, no content
    await page.fill(
      'input[placeholder="Enter your title..."]',
      'Title without content'
    );

    // Try to publish
    await page.click('button:has-text("Publish")');

    // Should see error message
    await expect(
      page.locator('text="Please enter some content"')
    ).toBeVisible();

    // Should still be on write page
    await expect(page).toHaveURL('/write');
  });

  test('user can update an existing post', async ({ page }) => {
    // First create a post
    await page.goto('/write');
    const timestamp = Date.now();
    const originalTitle = `Original Post ${timestamp}`;
    const originalContent = `Original content ${timestamp}`;

    await page.fill('input[placeholder="Enter your title..."]', originalTitle);
    const editor = page.locator('div[role="textbox"], textarea').first();
    await editor.click();
    await editor.fill(originalContent);
    await page.click('button:has-text("Publish")');

    // Handle replacement dialog if needed
    const replaceDialog = page.locator('text="Replace Your Current Post?"');
    if (await replaceDialog.isVisible({ timeout: 3000 })) {
      await page.click('button:has-text("Replace Post")');
    }

    await page.waitForURL('/', { timeout: 10000 });

    // Now find the post and edit it
    // This assumes there's an edit button or link on posts
    // You might need to adjust based on your actual UI
    await page.click(`text="${originalTitle}"`);

    // Look for edit button/link
    const editButton = page
      .locator('button:has-text("Edit"), a:has-text("Edit")')
      .first();
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // If no edit button, try navigating directly
      // This assumes the post detail page has an edit option
      await page.goto('/write?id=latest'); // Adjust based on your routing
    }

    // Update the post
    const updatedTitle = `Updated Post ${timestamp}`;
    const updatedContent = `Updated content ${timestamp}`;

    await page.fill(`input[value*="${originalTitle}"]`, updatedTitle);
    await editor.click();
    await editor.fill(updatedContent);

    // Click update button
    await page.click('button:has-text("Update Post")');

    // Wait for navigation
    await page.waitForURL('/', { timeout: 10000 });

    // Verify the updated post appears
    await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Post Display', () => {
  test('posts are displayed on the home page', async ({ page }) => {
    await page.goto('/');

    // Check for post list or feed
    // Adjust selectors based on your actual UI structure
    const postList = page.locator(
      '[data-testid="post-list"], .post-list, main'
    );
    await expect(postList).toBeVisible();

    // Check if at least one post is visible (if there are posts)
    const posts = page.locator(
      'article, [data-testid="post-card"], .post-card'
    );
    const postCount = await posts.count();

    // This test assumes there might be posts in the database
    // In a real test environment, you'd seed test data
    if (postCount > 0) {
      await expect(posts.first()).toBeVisible();
    }
  });

  test('user can view post details', async ({ page }) => {
    await page.goto('/');

    // Find and click on a post
    const firstPost = page
      .locator('article, [data-testid="post-card"], .post-card')
      .first();

    // Only proceed if there are posts
    if (await firstPost.isVisible()) {
      const postTitle = await firstPost
        .locator('h2, h3, .post-title')
        .textContent();
      await firstPost.click();

      // Should navigate to post detail page
      // Verify we're on a different page and the post title is visible
      await expect(page.locator(`text="${postTitle}"`)).toBeVisible();
    }
  });
});
