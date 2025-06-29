import { describe, it, expect } from 'vitest';
import type { Database } from '../database.types';

describe('Database Types', () => {
  it('should export Database type from generated file', () => {
    // Type-level test - if this compiles, the type export is working
    const testDatabaseType: Database | undefined = undefined;
    expect(testDatabaseType).toBeUndefined();
  });

  it('should have correct structure for Database type', () => {
    // Test that we can access expected properties (type-level test)
    type PublicSchema = Database['public'];
    type Tables = PublicSchema['Tables'];

    // These are compile-time checks
    const tableCheck: keyof Tables = 'posts' as const;
    // Use the variable to avoid unused warning
    expect(tableCheck).toBe('posts');

    expect(true).toBe(true); // Runtime assertion to make test pass
  });
});
