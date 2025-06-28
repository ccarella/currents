import { FullConfig } from '@playwright/test';
import { globalTestTeardown } from './test-helpers/test-data';

async function globalTeardown(_config: FullConfig) {
  // Running global teardown...

  try {
    await globalTestTeardown();
    // Global teardown completed
  } catch {
    // Global teardown failed
    // Don't throw - we want teardown to complete even if there are errors
  }
}

export default globalTeardown;
