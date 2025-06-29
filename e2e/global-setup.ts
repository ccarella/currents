import { chromium, FullConfig } from '@playwright/test';
import { globalTestSetup } from './test-helpers/test-data';

async function globalSetup(config: FullConfig) {
  // Running global setup...

  try {
    // Set up test data
    const { defaultUser } = await globalTestSetup();

    // Store default user data for tests to use
    process.env['TEST_USER_EMAIL'] = defaultUser.email;
    process.env['TEST_USER_PASSWORD'] = defaultUser.password;
    process.env['TEST_USER_USERNAME'] = defaultUser.username;
    process.env['TEST_USER_ID'] = defaultUser.id;

    // Pre-warm the application by visiting it once
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(
        config.projects?.[0]?.use?.baseURL || 'http://localhost:3000'
      );
      await page.waitForLoadState('networkidle');
      // Application is ready for testing
    } catch {
      // Failed to pre-warm application
    } finally {
      await browser.close();
    }

    // Global setup completed
  } catch (error) {
    // Global setup failed
    throw error;
  }
}

export default globalSetup;
