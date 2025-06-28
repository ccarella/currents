import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/sign-up');
  });

  test('user can sign up with valid credentials', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = 'TestPassword123';

    // Fill in the sign-up form
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="username"]', testUsername);
    await page.fill('input[id="password"]', testPassword);

    // Wait for username availability check
    await page.waitForTimeout(600); // Wait for debounce

    // Check for username availability indicator
    await expect(page.locator('svg.text-green-500')).toBeVisible();

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to home page
    await page.waitForURL('/', { timeout: 10000 });

    // Verify user is logged in by checking for user-specific elements
    // The exact elements to check will depend on your app's structure
    await expect(page).toHaveURL('/');
  });

  test('user cannot sign up with invalid email', async ({ page }) => {
    // Fill in the form with invalid email
    await page.fill('input[id="email"]', 'invalid-email');
    await page.fill('input[id="username"]', 'validusername');
    await page.fill('input[id="password"]', 'ValidPassword123');

    // Try to submit
    await page.click('button[type="submit"]');

    // Check for email error message
    await expect(page.locator('#email-error')).toContainText(
      'Please enter a valid email address'
    );
  });

  test('user cannot sign up with weak password', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;

    // Fill in the form with weak password
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="username"]', testUsername);
    await page.fill('input[id="password"]', 'weak');

    // Try to submit
    await page.click('button[type="submit"]');

    // Check for password error message
    await expect(page.locator('#password-error')).toContainText(
      'Password must be at least 8 characters'
    );
  });

  test('user cannot sign up with existing username', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@example.com`;

    // Use a common username that might already exist
    // In a real test environment, you'd first create a user with this username
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'ValidPassword123');

    // Wait for username availability check
    await page.waitForTimeout(600); // Wait for debounce

    // Check for username unavailable indicator
    const usernameError = page.locator('#username-error');
    const unavailableIcon = page.locator('svg.text-red-500');

    // Either the error message or the red X icon should be visible
    await expect(usernameError.or(unavailableIcon)).toBeVisible();

    // Submit button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('user can navigate to sign in page', async ({ page }) => {
    // Click the "Sign in" link
    await page.click('a[href="/auth/sign-in"]');

    // Verify navigation
    await expect(page).toHaveURL('/auth/sign-in');
    await expect(page.locator('h2')).toContainText('Sign in to your account');
  });
});

test.describe('User Sign In', () => {
  test('user can sign in with valid credentials', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/sign-in');

    // For this test to work, you need a test user in your database
    // In a real test environment, you'd set this up in a beforeAll hook
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123';

    // Fill in the sign-in form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('/', { timeout: 10000 });

    // Verify user is logged in
    await expect(page).toHaveURL('/');
  });
});
