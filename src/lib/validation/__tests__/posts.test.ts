import { describe, it, expect } from 'vitest';
import { createPostSchema, paginationSchema } from '../posts';

describe('Post Validation Schemas', () => {
  describe('createPostSchema', () => {
    it('should validate a valid post', () => {
      const validPost = {
        title: 'Valid Post Title',
        content: 'This is the post content',
        excerpt: 'A brief excerpt',
        status: 'published' as const,
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPost);
      }
    });

    it('should validate a minimal post with only title', () => {
      const minimalPost = {
        title: 'Minimal Post',
      };

      const result = createPostSchema.safeParse(minimalPost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Minimal Post');
        expect(result.data.status).toBe('published'); // default
        expect(result.data.content).toBeUndefined();
        expect(result.data.excerpt).toBeUndefined();
      }
    });

    it('should reject empty title', () => {
      const invalidPost = {
        title: '',
        content: 'Content',
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Title is required');
      }
    });

    it('should reject title longer than 255 characters', () => {
      const longTitle = 'a'.repeat(256);
      const invalidPost = {
        title: longTitle,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Title is too long');
      }
    });

    it('should reject excerpt longer than 500 characters', () => {
      const longExcerpt = 'a'.repeat(501);
      const invalidPost = {
        title: 'Valid Title',
        excerpt: longExcerpt,
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Excerpt is too long');
      }
    });

    it('should reject invalid status', () => {
      const invalidPost = {
        title: 'Valid Title',
        status: 'invalid',
      };

      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should accept draft status', () => {
      const draftPost = {
        title: 'Draft Post',
        status: 'draft' as const,
      };

      const result = createPostSchema.safeParse(draftPost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });
  });

  describe('paginationSchema', () => {
    it('should use default values when no params provided', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should parse string numbers', () => {
      const result = paginationSchema.safeParse({
        page: '3',
        limit: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject negative page', () => {
      const result = paginationSchema.safeParse({
        page: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero page', () => {
      const result = paginationSchema.safeParse({
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = paginationSchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer values', () => {
      const result = paginationSchema.safeParse({
        page: 1.5,
        limit: 20.7,
      });
      expect(result.success).toBe(false);
    });

    it('should handle null values', () => {
      const result = paginationSchema.safeParse({
        page: null,
        limit: null,
      });
      expect(result.success).toBe(false); // null won't coerce to number
    });

    it('should handle undefined values by using defaults', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });
});
