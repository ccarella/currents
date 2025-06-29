import { test, expect, Page } from '@playwright/test';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000,
  firstContentfulPaint: 1800,
  largestContentfulPaint: 2500,
  timeToInteractive: 3500,
  totalBlockingTime: 300,
};

// Helper to measure performance metrics
async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const fcp = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    );
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();

    return {
      // Navigation timing
      domContentLoaded:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,

      // Core Web Vitals
      firstContentfulPaint: fcp ? fcp.startTime : null,
      largestContentfulPaint: lcp ? lcp.startTime : null,

      // Resource timing
      resourceCount: performance.getEntriesByType('resource').length,
      totalResourceSize: performance
        .getEntriesByType('resource')
        .reduce((acc, resource) => {
          return (
            acc + ((resource as PerformanceResourceTiming).transferSize || 0)
          );
        }, 0),

      // Memory usage (if available)
      memory: (
        performance as {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory
        ? {
            usedJSHeapSize: (
              performance as unknown as { memory: { usedJSHeapSize: number } }
            ).memory.usedJSHeapSize,
            totalJSHeapSize: (
              performance as unknown as { memory: { totalJSHeapSize: number } }
            ).memory.totalJSHeapSize,
            jsHeapSizeLimit: (
              performance as unknown as { memory: { jsHeapSizeLimit: number } }
            ).memory.jsHeapSizeLimit,
          }
        : null,
    };
  });
}

test.describe('Performance Benchmarks', () => {
  test('home page performance', async ({ page }) => {
    // Start measuring
    await page.goto('/', { waitUntil: 'networkidle' });

    // Get performance metrics
    const metrics = await getPerformanceMetrics(page);

    // Log metrics for reporting
    // console.log('Home Page Performance Metrics:', JSON.stringify(metrics, null, 2));

    // Assert performance thresholds
    expect(metrics.loadComplete).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    if (metrics.firstContentfulPaint) {
      expect(metrics.firstContentfulPaint).toBeLessThan(
        PERFORMANCE_THRESHOLDS.firstContentfulPaint
      );
    }

    if (metrics.largestContentfulPaint) {
      expect(metrics.largestContentfulPaint).toBeLessThan(
        PERFORMANCE_THRESHOLDS.largestContentfulPaint
      );
    }

    // Check resource usage
    expect(metrics.resourceCount).toBeLessThan(100); // Limit number of resources
    expect(metrics.totalResourceSize).toBeLessThan(5 * 1024 * 1024); // 5MB limit
  });

  test('authentication pages performance', async ({ page }) => {
    const authPages = ['/auth/sign-up', '/auth/sign-in'];

    for (const authPage of authPages) {
      await page.goto(authPage, { waitUntil: 'networkidle' });

      const metrics = await getPerformanceMetrics(page);

      // console.log(`${authPage} Performance Metrics:`, JSON.stringify(metrics, null, 2));

      // Auth pages should be lightweight and fast
      expect(metrics.loadComplete).toBeLessThan(2000);
      expect(metrics.domInteractive).toBeLessThan(1500);
    }
  });

  test('interaction responsiveness', async ({ page }) => {
    await page.goto('/auth/sign-up');

    // Measure input responsiveness

    const inputDelay = await page.evaluate(async () => {
      const input = document.querySelector(
        'input[id="email"]'
      ) as HTMLInputElement;

      return new Promise<number>((resolve) => {
        const startTime = performance.now();

        input.addEventListener(
          'input',
          () => {
            const endTime = performance.now();
            resolve(endTime - startTime);
          },
          { once: true }
        );

        // Simulate typing
        input.value = 't';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // console.log(`Input responsiveness: ${inputDelay}ms`);
    expect(inputDelay).toBeLessThan(50); // Input should respond within 50ms
  });

  test('navigation performance', async ({ page }) => {
    // Start from home
    await page.goto('/');

    // Measure navigation to sign up
    const navigationStart = Date.now();
    await page.click('a[href="/auth/sign-up"]');
    await page.waitForURL('/auth/sign-up');
    const navigationTime = Date.now() - navigationStart;

    // console.log(`Navigation time (home -> sign-up): ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(1000); // Navigation should complete within 1s
  });

  test('form submission performance', async ({ page }) => {
    await page.goto('/auth/sign-up');

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[id="email"]', `perf.test.${timestamp}@example.com`);
    await page.fill('input[id="username"]', `perfuser${timestamp}`);
    await page.fill('input[id="password"]', 'TestPassword123');

    // Wait for username check
    await page.waitForTimeout(600);

    // Measure submission time
    const submissionStart = Date.now();
    await page.click('button[type="submit"]');

    // Wait for response (either success or error)
    await Promise.race([
      page.waitForURL('/', { timeout: 10000 }),
      page.waitForSelector('.text-red-800', { timeout: 10000 }), // Error message
    ]);

    const submissionTime = Date.now() - submissionStart;

    // console.log(`Form submission time: ${submissionTime}ms`);
    expect(submissionTime).toBeLessThan(5000); // Should complete within 5s
  });

  test('bundle size analysis', async ({ page }) => {
    const resourceSizes: Record<string, number> = {};

    // Track resource sizes
    page.on('response', (response) => {
      const url = response.url();
      const size = response.headers()['content-length'];

      if (size && (url.includes('.js') || url.includes('.css'))) {
        const filename = url.split('/').pop() || 'unknown';
        resourceSizes[filename] = parseInt(size);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Calculate total bundle size
    const totalJSSize = Object.entries(resourceSizes)
      .filter(([name]) => name.endsWith('.js'))
      .reduce((acc, [, size]) => acc + size, 0);

    const totalCSSSize = Object.entries(resourceSizes)
      .filter(([name]) => name.endsWith('.css'))
      .reduce((acc, [, size]) => acc + size, 0);

    // console.log('Bundle sizes:', {
    //   js: `${(totalJSSize / 1024).toFixed(2)} KB`,
    //   css: `${(totalCSSSize / 1024).toFixed(2)} KB`,
    //   total: `${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`,
    //   resources: resourceSizes,
    // });

    // Assert bundle size limits
    expect(totalJSSize).toBeLessThan(1024 * 1024); // 1MB JS limit
    expect(totalCSSSize).toBeLessThan(256 * 1024); // 256KB CSS limit
  });

  test('memory leak detection', async ({ page }) => {
    await page.goto('/');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (
        (performance as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0
      );
    });

    // Perform multiple navigations
    for (let i = 0; i < 5; i++) {
      await page.goto('/auth/sign-up');
      await page.goto('/auth/sign-in');
      await page.goto('/');
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as { gc?: () => void }).gc) {
        (window as { gc: () => void }).gc();
      }
    });

    // Wait a bit for cleanup
    await page.waitForTimeout(1000);

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (
        (performance as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0
      );
    });

    const memoryIncrease = finalMemory - initialMemory;
    const percentageIncrease = (memoryIncrease / initialMemory) * 100;

    // console.log('Memory usage:', {
    //   initial: `${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
    //   final: `${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
    //   increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
    //   percentageIncrease: `${percentageIncrease.toFixed(2)}%`,
    // });

    // Memory shouldn't increase by more than 50%
    expect(percentageIncrease).toBeLessThan(50);
  });
});

test.describe('Performance Under Load', () => {
  test('concurrent user simulation', async ({ browser }) => {
    const userCount = 5;
    const contexts = [];
    const pages = [];

    // Create multiple browser contexts
    for (let i = 0; i < userCount; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }

    // Measure concurrent page loads
    const loadTimes = await Promise.all(
      pages.map(async (page, index) => {
        const start = Date.now();
        await page.goto('/');
        const loadTime = Date.now() - start;

        return {
          user: index + 1,
          loadTime,
        };
      })
    );

    // Calculate statistics
    const avgLoadTime =
      loadTimes.reduce((acc, { loadTime }) => acc + loadTime, 0) / userCount;
    const maxLoadTime = Math.max(...loadTimes.map(({ loadTime }) => loadTime));

    // console.log('Concurrent load test results:', {
    //   userCount,
    //   loadTimes,
    //   average: `${avgLoadTime.toFixed(2)}ms`,
    //   max: `${maxLoadTime}ms`,
    // });

    // Even under load, pages should load reasonably fast
    expect(avgLoadTime).toBeLessThan(5000);
    expect(maxLoadTime).toBeLessThan(8000);

    // Cleanup
    await Promise.all(contexts.map((context) => context.close()));
  });
});
