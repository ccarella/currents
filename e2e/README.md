# End-to-End Testing Suite

This directory contains comprehensive end-to-end tests for the application using Playwright.

## Test Structure

- `auth.spec.ts` - Authentication flow tests (signup, signin)
- `posts.spec.ts` - Post creation and management tests
- `visual-regression.spec.ts` - Visual consistency tests
- `performance.spec.ts` - Performance benchmarking tests
- `example-with-fixtures.spec.ts` - Examples using test data fixtures
- `test-helpers/` - Utilities for test data management
- `screenshots/` - Visual regression baseline images

## Running Tests

### Prerequisites

1. Ensure the application is running:

   ```bash
   npm run dev
   ```

2. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

### Running All Tests

```bash
npm run test:e2e
```

### Running Specific Test Files

```bash
# Run auth tests only
npx playwright test auth.spec.ts

# Run visual regression tests
npx playwright test visual-regression.spec.ts

# Run performance tests
npx playwright test performance.spec.ts
```

### Running Tests in UI Mode

```bash
npx playwright test --ui
```

### Running Tests with Specific Browser

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile Safari
npx playwright test --project="Mobile Safari"
```

## Test Data Management

The test suite includes utilities for managing test data:

### Test User Credentials

A default test user is created during global setup:

- Email: `test@example.com`
- Password: `TestPassword123`
- Username: `testuser`

### Creating Test Data

```typescript
import { testFixtures } from './test-helpers/test-data';

// Create a user with a post
const fixture = await testFixtures.userWithPost();

// Create multiple users
const { users, cleanup } = await testFixtures.multipleUsers(3);

// Always clean up
await cleanup();
```

### Manual Cleanup

If tests fail and leave data behind:

```bash
# Run the cleanup test
npx playwright test example-with-fixtures.spec.ts -g "cleanup orphaned test data"
```

## Visual Regression Testing

Visual regression tests capture screenshots and compare them against baselines.

### Updating Baselines

When UI changes are intentional:

```bash
# Update all visual regression baselines
npx playwright test visual-regression.spec.ts --update-snapshots

# Update specific test
npx playwright test visual-regression.spec.ts --update-snapshots -g "home page"
```

### Viewing Differences

Failed visual tests will generate diff images in `test-results/`.

## Performance Testing

Performance tests measure:

- Page load times
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Bundle sizes
- Memory usage

Results are logged to console and can be found in test reports.

## CI/CD Integration

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests

GitHub Actions workflow handles:

- Running all E2E tests
- Visual regression across browsers
- Performance benchmarking
- Artifact uploads for failed tests

## Environment Variables

Required for tests:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for test data management)

## Debugging Tests

### Enable Debug Mode

```bash
# Show browser UI and slow down execution
npx playwright test --debug

# Save trace for debugging
npx playwright test --trace on
```

### View Test Reports

```bash
# After test run
npx playwright show-report
```

### Common Issues

1. **Tests timing out**: Increase timeout in test or globally in config
2. **Visual regression failures**: Check if UI actually changed, update snapshots if needed
3. **Authentication failures**: Ensure test user exists in database
4. **Performance failures**: Check if thresholds need adjustment for your environment

## Writing New Tests

1. Use Page Object Model for complex pages
2. Always clean up test data
3. Use data-testid attributes for reliable selectors
4. Group related tests with describe blocks
5. Use meaningful test names that describe the scenario

Example:

```typescript
test('user can create and publish a post', async ({ page }) => {
  // Arrange
  const postData = generateTestPost();

  // Act
  await page.goto('/write');
  await page.fill('[data-testid="post-title"]', postData.title);
  await page.fill('[data-testid="post-content"]', postData.content);
  await page.click('[data-testid="publish-button"]');

  // Assert
  await expect(page).toHaveURL('/');
  await expect(page.locator(`text="${postData.title}"`)).toBeVisible();
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Reliability**: Use proper waits and assertions
4. **Readability**: Write clear, descriptive tests
5. **Performance**: Keep tests fast and focused
6. **Maintenance**: Update tests when features change
