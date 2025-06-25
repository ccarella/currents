import { describe, it, expect } from 'vitest';
import {
  CreatePostSchema,
  UpdatePostSchema,
  CreateProfileSchema,
  UpdateProfileSchema,
  CreateTagSchema,
  UpdateTagSchema,
  CreateUserSchema,
  UpdateUserSchema,
  PostQuerySchema,
  PaginationSchema,
  PostStatusSchema,
  uuidSchema,
  emailSchema,
  slugSchema,
  BatchCreatePostsSchema,
  BatchUpdatePostsSchema,
  BatchDeleteSchema,
} from '../schemas';

describe('Common Schemas', () => {
  describe('uuidSchema', () => {
    it('should validate valid UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => uuidSchema.parse(validUuid)).not.toThrow();
    });

    it('should reject invalid UUIDs', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
      expect(() => uuidSchema.parse('123')).toThrow();
      expect(() => uuidSchema.parse('')).toThrow();
    });
  });

  describe('emailSchema', () => {
    it('should validate valid emails', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow();
      expect(() => emailSchema.parse('user+tag@domain.co.uk')).not.toThrow();
    });

    it('should reject invalid emails', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
      expect(() => emailSchema.parse('test@')).toThrow();
    });
  });

  describe('slugSchema', () => {
    it('should validate valid slugs', () => {
      expect(() => slugSchema.parse('valid-slug')).not.toThrow();
      expect(() => slugSchema.parse('another-valid-slug-123')).not.toThrow();
      expect(() => slugSchema.parse('simple')).not.toThrow();
    });

    it('should reject invalid slugs', () => {
      expect(() => slugSchema.parse('Invalid Slug')).toThrow();
      expect(() => slugSchema.parse('slug_with_underscore')).toThrow();
      expect(() => slugSchema.parse('UPPERCASE')).toThrow();
      expect(() => slugSchema.parse('slug-')).toThrow();
      expect(() => slugSchema.parse('-slug')).toThrow();
    });
  });
});

describe('Profile Schemas', () => {
  describe('CreateProfileSchema', () => {
    it('should validate valid profile creation data', () => {
      const validProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe123',
        full_name: 'John Doe',
        bio: 'Software developer',
        avatar_url: 'https://example.com/avatar.jpg',
      };
      expect(() => CreateProfileSchema.parse(validProfile)).not.toThrow();
    });

    it('should accept null values for optional fields', () => {
      const profileWithNulls = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: null,
        full_name: null,
        bio: null,
        avatar_url: null,
      };
      expect(() => CreateProfileSchema.parse(profileWithNulls)).not.toThrow();
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = ['ab', 'a'.repeat(31), 'user@name', 'user name'];
      invalidUsernames.forEach((username) => {
        expect(() =>
          CreateProfileSchema.parse({
            id: '123e4567-e89b-12d3-a456-426614174000',
            username,
          })
        ).toThrow();
      });
    });
  });

  describe('UpdateProfileSchema', () => {
    it('should allow partial updates', () => {
      expect(() =>
        UpdateProfileSchema.parse({ username: 'new_username' })
      ).not.toThrow();
      expect(() => UpdateProfileSchema.parse({ bio: 'New bio' })).not.toThrow();
      expect(() => UpdateProfileSchema.parse({})).not.toThrow();
    });

    it('should not allow id updates', () => {
      const schema = UpdateProfileSchema;
      const parsed = schema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'test',
      });
      expect(parsed).not.toHaveProperty('id');
    });
  });
});

describe('Post Schemas', () => {
  describe('PostStatusSchema', () => {
    it('should validate valid statuses', () => {
      expect(() => PostStatusSchema.parse('draft')).not.toThrow();
      expect(() => PostStatusSchema.parse('published')).not.toThrow();
      expect(() => PostStatusSchema.parse('archived')).not.toThrow();
    });

    it('should reject invalid statuses', () => {
      expect(() => PostStatusSchema.parse('pending')).toThrow();
      expect(() => PostStatusSchema.parse('deleted')).toThrow();
    });
  });

  describe('CreatePostSchema', () => {
    it('should validate valid post creation data', () => {
      const validPost = {
        title: 'Test Post',
        content: 'This is the content',
        excerpt: 'Short excerpt',
        status: 'draft',
        slug: 'test-post',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        published_at: new Date().toISOString(),
      };
      expect(() => CreatePostSchema.parse(validPost)).not.toThrow();
    });

    it('should enforce title constraints', () => {
      const basePost = {
        slug: 'test',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(() => CreatePostSchema.parse({ ...basePost, title: '' })).toThrow(
        'Title is required'
      );

      expect(() =>
        CreatePostSchema.parse({ ...basePost, title: 'a'.repeat(201) })
      ).toThrow();
    });

    it('should default status to draft', () => {
      const post = {
        title: 'Test',
        slug: 'test',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        content: null,
        excerpt: null,
        published_at: null,
      };
      const parsed = CreatePostSchema.parse(post);
      expect(parsed.status).toBe('draft');
    });
  });

  describe('UpdatePostSchema', () => {
    it('should allow partial updates', () => {
      expect(() =>
        UpdatePostSchema.parse({ title: 'New Title' })
      ).not.toThrow();
      expect(() =>
        UpdatePostSchema.parse({ status: 'published' })
      ).not.toThrow();
      expect(() => UpdatePostSchema.parse({})).not.toThrow();
    });

    it('should not allow author_id updates', () => {
      const parsed = UpdatePostSchema.parse({
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'New Title',
      });
      expect(parsed).not.toHaveProperty('author_id');
    });
  });
});

describe('Tag Schemas', () => {
  describe('CreateTagSchema', () => {
    it('should validate valid tag creation data', () => {
      const validTag = {
        name: 'JavaScript',
        slug: 'javascript',
      };
      expect(() => CreateTagSchema.parse(validTag)).not.toThrow();
    });

    it('should enforce name constraints', () => {
      expect(() => CreateTagSchema.parse({ name: '', slug: 'test' })).toThrow();

      expect(() =>
        CreateTagSchema.parse({ name: 'a'.repeat(51), slug: 'test' })
      ).toThrow();
    });
  });

  describe('UpdateTagSchema', () => {
    it('should allow partial updates', () => {
      expect(() => UpdateTagSchema.parse({ name: 'New Name' })).not.toThrow();
      expect(() => UpdateTagSchema.parse({ slug: 'new-slug' })).not.toThrow();
      expect(() => UpdateTagSchema.parse({})).not.toThrow();
    });
  });
});

describe('User Schemas', () => {
  describe('CreateUserSchema', () => {
    it('should validate valid user creation data', () => {
      const validUser = {
        username: 'john_doe',
        email: 'john@example.com',
      };
      expect(() => CreateUserSchema.parse(validUser)).not.toThrow();
    });

    it('should enforce username constraints', () => {
      const invalidUsernames = ['ab', 'a'.repeat(31), 'user@name', 'user name'];
      invalidUsernames.forEach((username) => {
        expect(() =>
          CreateUserSchema.parse({ username, email: 'test@example.com' })
        ).toThrow();
      });
    });
  });

  describe('UpdateUserSchema', () => {
    it('should allow partial updates', () => {
      expect(() =>
        UpdateUserSchema.parse({ username: 'new_username' })
      ).not.toThrow();
      expect(() =>
        UpdateUserSchema.parse({ email: 'new@example.com' })
      ).not.toThrow();
      expect(() => UpdateUserSchema.parse({})).not.toThrow();
    });
  });
});

describe('Query Parameter Schemas', () => {
  describe('PaginationSchema', () => {
    it('should validate valid pagination params', () => {
      expect(() =>
        PaginationSchema.parse({ page: 1, limit: 20 })
      ).not.toThrow();
      expect(() =>
        PaginationSchema.parse({ page: '2', limit: '50' })
      ).not.toThrow(); // coercion
    });

    it('should apply defaults', () => {
      const parsed = PaginationSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
    });

    it('should enforce constraints', () => {
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ page: -1 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 0 })).toThrow();
    });

    it('should handle offset', () => {
      const parsed = PaginationSchema.parse({ offset: 10 });
      expect(parsed.offset).toBe(10);

      expect(() => PaginationSchema.parse({ offset: -1 })).toThrow();
    });
  });

  describe('PostQuerySchema', () => {
    it('should validate valid post query params', () => {
      const validQuery = {
        page: 1,
        limit: 20,
        status: 'published',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        search: 'keyword',
        sort_by: 'created_at',
        order: 'desc',
      };
      expect(() => PostQuerySchema.parse(validQuery)).not.toThrow();
    });

    it('should apply defaults for sorting', () => {
      const parsed = PostQuerySchema.parse({});
      expect(parsed.sort_by).toBe('created_at');
      expect(parsed.order).toBe('desc');
    });

    it('should validate sort fields', () => {
      expect(() => PostQuerySchema.parse({ sort_by: 'invalid' })).toThrow();
      expect(() => PostQuerySchema.parse({ order: 'random' })).toThrow();
    });
  });
});

describe('Batch Operation Schemas', () => {
  describe('BatchCreatePostsSchema', () => {
    it('should validate valid batch create', () => {
      const validBatch = {
        posts: [
          {
            title: 'Post 1',
            content: 'Content 1',
            slug: 'post-1',
            author_id: '123e4567-e89b-12d3-a456-426614174000',
            excerpt: null,
            status: 'draft',
            published_at: null,
          },
          {
            title: 'Post 2',
            content: 'Content 2',
            slug: 'post-2',
            author_id: '123e4567-e89b-12d3-a456-426614174000',
            excerpt: null,
            status: 'draft',
            published_at: null,
          },
        ],
      };
      expect(() => BatchCreatePostsSchema.parse(validBatch)).not.toThrow();
    });

    it('should enforce array constraints', () => {
      expect(() => BatchCreatePostsSchema.parse({ posts: [] })).toThrow();

      const tooManyPosts = {
        posts: Array(101).fill({
          title: 'Post',
          slug: 'post',
          author_id: '123e4567-e89b-12d3-a456-426614174000',
          content: null,
          excerpt: null,
          status: 'draft',
          published_at: null,
        }),
      };
      expect(() => BatchCreatePostsSchema.parse(tooManyPosts)).toThrow();
    });
  });

  describe('BatchUpdatePostsSchema', () => {
    it('should validate valid batch update', () => {
      const validBatch = {
        updates: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            data: { title: 'Updated Title 1' },
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174000',
            data: { status: 'published' },
          },
        ],
      };
      expect(() => BatchUpdatePostsSchema.parse(validBatch)).not.toThrow();
    });
  });

  describe('BatchDeleteSchema', () => {
    it('should validate valid batch delete', () => {
      const validBatch = {
        ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174000',
        ],
      };
      expect(() => BatchDeleteSchema.parse(validBatch)).not.toThrow();
    });

    it('should enforce constraints', () => {
      expect(() => BatchDeleteSchema.parse({ ids: [] })).toThrow();
      expect(() => BatchDeleteSchema.parse({ ids: ['not-a-uuid'] })).toThrow();
    });
  });
});
