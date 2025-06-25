import { describe, it, expect } from 'vitest';
import {
  CreatePostSchema,
  UpdatePostSchema,
  CreateProfileSchema,
  CreateTagSchema,
  CreateUserSchema,
} from '@/types/schemas';
import { dbValidators } from '../database';

describe('Runtime Type Safety', () => {
  describe('Schema validation catches type mismatches', () => {
    it('should catch invalid post creation data at runtime', () => {
      const invalidData = {
        title: 123, // Should be string
        content: true, // Should be string or null
        slug: 'valid-slug',
        author_id: 'not-a-uuid',
        status: 'invalid-status', // Should be one of the enum values
      };

      expect(() => CreatePostSchema.parse(invalidData)).toThrow();
      expect(() => dbValidators.posts.create(invalidData)).toThrow();
    });

    it('should catch missing required fields', () => {
      const incompleteData = {
        title: 'Valid Title',
        // Missing required fields: slug, author_id
      };

      expect(() => CreatePostSchema.parse(incompleteData)).toThrow();
      expect(() => dbValidators.posts.create(incompleteData)).toThrow();
    });

    it('should catch data that violates constraints', () => {
      const constraintViolations = [
        {
          // Title too long
          data: {
            title: 'a'.repeat(201),
            slug: 'valid-slug',
            author_id: '123e4567-e89b-12d3-a456-426614174000',
            content: null,
            excerpt: null,
            status: 'draft',
            published_at: null,
          },
          schema: CreatePostSchema,
        },
        {
          // Invalid username format
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            username: 'user@name', // Contains invalid character
            full_name: null,
            bio: null,
            avatar_url: null,
          },
          schema: CreateProfileSchema,
        },
        {
          // Invalid email format
          data: {
            username: 'validuser',
            email: 'not-an-email',
          },
          schema: CreateUserSchema,
        },
        {
          // Invalid slug format
          data: {
            name: 'Valid Name',
            slug: 'Invalid Slug', // Contains uppercase and space
          },
          schema: CreateTagSchema,
        },
      ];

      constraintViolations.forEach(({ data, schema }) => {
        expect(() => schema.parse(data)).toThrow();
      });
    });
  });

  describe('Update operations validate partial data', () => {
    it('should allow valid partial updates', () => {
      const validUpdates = [
        { title: 'New Title' },
        { status: 'published' },
        { content: 'Updated content' },
        {},
      ];

      validUpdates.forEach((update) => {
        expect(() => UpdatePostSchema.parse(update)).not.toThrow();
      });
    });

    it('should reject invalid partial updates', () => {
      const invalidUpdates = [
        { status: 'invalid-status' },
        { title: '' }, // Empty string should fail
        { slug: 'Invalid Slug' }, // Invalid format
      ];

      invalidUpdates.forEach((update) => {
        expect(() => UpdatePostSchema.parse(update)).toThrow();
      });
    });
  });

  describe('Database validators provide consistent behavior', () => {
    it('should validate all CRUD operations', () => {
      // Valid data should pass
      const validPost = {
        title: 'Test Post',
        content: 'Content',
        slug: 'test-post',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        excerpt: null,
        status: 'draft' as const,
        published_at: null,
      };

      expect(() => dbValidators.posts.create(validPost)).not.toThrow();
      expect(() =>
        dbValidators.posts.update({ title: 'Updated' })
      ).not.toThrow();
      expect(() =>
        dbValidators.posts.query({ page: 1, limit: 10 })
      ).not.toThrow();

      // Invalid data should fail
      expect(() => dbValidators.posts.create({ title: '' })).toThrow();
      expect(() => dbValidators.posts.update({ status: 'invalid' })).toThrow();
      expect(() => dbValidators.posts.query({ page: 0 })).toThrow();
    });
  });

  describe('Type inference works correctly', () => {
    it('should infer correct types from schemas', () => {
      // This test verifies TypeScript inference at compile time
      const post = CreatePostSchema.parse({
        title: 'Test',
        content: 'Content',
        slug: 'test',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        excerpt: null,
        status: 'draft',
        published_at: null,
      });

      // TypeScript should know these types
      const _title: string = post.title;
      const _content: string | null = post.content;
      const _status: 'draft' | 'published' | 'archived' = post.status;

      // This ensures our types are correctly inferred
      expect(typeof _title).toBe('string');
      expect(_content).toBe('Content');
      expect(_status).toBe('draft');
    });
  });
});
