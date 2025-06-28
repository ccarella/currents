import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('home page visual consistency', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('home-page-full.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Take screenshot of specific components
    const header = page.locator('header, nav').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('home-header.png');
    }

    const postList = page.locator(
      '[data-testid="post-list"], .post-list, main'
    );
    if (await postList.isVisible()) {
      await expect(postList).toHaveScreenshot('home-post-list.png');
    }
  });

  test('authentication pages visual consistency', async ({ page }) => {
    // Sign up page
    await page.goto('/auth/sign-up');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('signup-page.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Sign in page
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('signin-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('form validation states visual consistency', async ({ page }) => {
    await page.goto('/auth/sign-up');

    // Trigger validation errors
    await page.click('button[type="submit"]');

    // Wait for validation messages
    await page.waitForSelector('.text-red-600, #email-error', {
      timeout: 5000,
    });

    // Screenshot form with errors
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('signup-form-errors.png');

    // Fill in partial data to show different validation states
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="username"]', 'te'); // Too short
    await page.fill('input[id="password"]', 'weak'); // Too weak

    // Trigger validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500); // Wait for validation

    await expect(form).toHaveScreenshot('signup-form-partial-errors.png');
  });

  test('write page visual consistency', async ({ page }) => {
    // This test requires authentication
    // In a real scenario, you'd sign in first or mock the auth state

    // For now, let's just check if we get redirected
    await page.goto('/write');

    // If we're redirected to login, screenshot that
    if (page.url().includes('/auth/sign-in')) {
      await expect(page).toHaveScreenshot('write-page-redirect.png');
    } else {
      // If we can access it (e.g., in dev with disabled auth)
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('write-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('responsive design visual consistency', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Home page at different sizes
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, {
        fullPage: false, // Use viewport size
        animations: 'disabled',
      });

      // Auth page at different sizes
      await page.goto('/auth/sign-up');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`signup-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled',
      });
    }
  });

  test('dark mode visual consistency', async ({ page }) => {
    // Check if the app supports dark mode by looking for theme toggle or system preference
    await page.goto('/');

    // Try to enable dark mode
    // This depends on your implementation - adjust as needed
    const themeToggle = page.locator(
      '[data-testid="theme-toggle"], button[aria-label*="theme"], button[aria-label*="dark"]'
    );

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition

      await expect(page).toHaveScreenshot('home-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
    } else {
      // Try using system preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('home-dark-mode-system.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });
});

test.describe('Component Visual Tests', () => {
  test('button states visual consistency', async ({ page }) => {
    await page.goto('/auth/sign-up');

    const submitButton = page.locator('button[type="submit"]');

    // Normal state
    await expect(submitButton).toHaveScreenshot('button-normal.png');

    // Hover state
    await submitButton.hover();
    await expect(submitButton).toHaveScreenshot('button-hover.png');

    // Focus state
    await submitButton.focus();
    await expect(submitButton).toHaveScreenshot('button-focus.png');

    // Disabled state (form is invalid)
    await expect(submitButton).toHaveScreenshot('button-disabled.png');
  });

  test('input field states visual consistency', async ({ page }) => {
    await page.goto('/auth/sign-up');

    const emailInput = page.locator('input[id="email"]');

    // Normal state
    await expect(emailInput).toHaveScreenshot('input-normal.png');

    // Focus state
    await emailInput.focus();
    await expect(emailInput).toHaveScreenshot('input-focus.png');

    // Filled state
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveScreenshot('input-filled.png');

    // Error state
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(500); // Wait for validation
    await expect(emailInput).toHaveScreenshot('input-error.png');
  });
});
