import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { CreatePostSchema, UpdatePostSchema } from '@/types/schemas';
import {
  validateInsert,
  validateUpdate,
  dbValidators,
  ValidatedQueryBuilder,
  createValidatedClient,
  validateExists,
  validateUnique,
  validateManyExist,
} from '../database';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}));

describe('validateInsert', () => {
  it('should validate and parse insert data', () => {
    const data = {
      title: 'Test Post',
      content: 'Content',
      slug: 'test-post',
      author_id: '123e4567-e89b-12d3-a456-426614174000',
      excerpt: null,
      status: 'draft' as const,
      published_at: null,
    };

    const result = validateInsert(CreatePostSchema, data);
    expect(result).toEqual(
      expect.objectContaining({
        title: 'Test Post',
        content: 'Content',
        slug: 'test-post',
        status: 'draft',
      })
    );
  });

  it('should throw on invalid insert data', () => {
    const invalidData = {
      title: '', // Empty title should fail
      slug: 'test',
      author_id: 'not-a-uuid',
    };

    expect(() => validateInsert(CreatePostSchema, invalidData)).toThrow();
  });
});

describe('validateUpdate', () => {
  it('should validate and parse update data', () => {
    const data = {
      title: 'Updated Title',
      status: 'published' as const,
    };

    const result = validateUpdate(UpdatePostSchema, data);
    expect(result).toEqual({
      title: 'Updated Title',
      status: 'published',
    });
  });

  it('should allow empty updates', () => {
    const result = validateUpdate(UpdatePostSchema, {});
    expect(result).toEqual({});
  });
});

describe('dbValidators', () => {
  describe('posts validators', () => {
    it('should validate post creation', () => {
      const data = {
        title: 'Test Post',
        content: 'Content',
        slug: 'test-post',
        author_id: '123e4567-e89b-12d3-a456-426614174000',
        excerpt: null,
        status: 'draft',
        published_at: null,
      };

      expect(() => dbValidators.posts.create(data)).not.toThrow();
    });

    it('should validate post queries', () => {
      const params = {
        page: 1,
        limit: 20,
        status: 'published',
        sort_by: 'created_at',
        order: 'desc',
      };

      const result = dbValidators.posts.query(params);
      expect(result).toEqual(expect.objectContaining(params));
    });
  });

  describe('profiles validators', () => {
    it('should validate profile creation', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        full_name: 'John Doe',
        bio: null,
        avatar_url: null,
      };

      expect(() => dbValidators.profiles.create(data)).not.toThrow();
    });

    it('should reject invalid usernames', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'a', // Too short
      };

      expect(() => dbValidators.profiles.create(data)).toThrow();
    });
  });

  describe('tags validators', () => {
    it('should validate tag creation', () => {
      const data = {
        name: 'JavaScript',
        slug: 'javascript',
      };

      expect(() => dbValidators.tags.create(data)).not.toThrow();
    });

    it('should validate tag queries', () => {
      const params = {
        search: 'java',
        sort_by: 'name',
        order: 'asc',
      };

      const result = dbValidators.tags.query(params);
      expect(result).toEqual(expect.objectContaining(params));
    });
  });

  describe('users validators', () => {
    it('should validate user creation', () => {
      const data = {
        username: 'john_doe',
        email: 'john@example.com',
      };

      expect(() => dbValidators.users.create(data)).not.toThrow();
    });

    it('should reject invalid emails', () => {
      const data = {
        username: 'john_doe',
        email: 'not-an-email',
      };

      expect(() => dbValidators.users.create(data)).toThrow();
    });
  });
});

describe('ValidatedQueryBuilder', () => {
  let supabase: ReturnType<typeof createClient>;
  let queryBuilder: ValidatedQueryBuilder<'posts'>;

  beforeEach(() => {
    supabase = createClient('', '');
    queryBuilder = new ValidatedQueryBuilder(supabase, 'posts');
  });

  it('should validate data before creating', async () => {
    const invalidData = {
      title: '', // Invalid
      slug: 'test',
      author_id: 'not-a-uuid', // Invalid
    };

    await expect(queryBuilder.create(invalidData)).rejects.toThrow();
  });

  it('should validate data before updating', async () => {
    const invalidData = {
      status: 'invalid-status',
    };

    await expect(queryBuilder.update('123', invalidData)).rejects.toThrow();
  });

  it('should handle findMany with validated params', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };

    supabase.from = vi.fn(() => mockQuery);

    const params = {
      page: 2,
      limit: 10,
      status: 'published' as const,
      sort_by: 'title' as const,
      order: 'asc' as const,
    };

    await queryBuilder.findMany(params);

    expect(supabase.from).toHaveBeenCalledWith('posts');
    expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
    expect(mockQuery.order).toHaveBeenCalledWith('title', { ascending: true });
  });
});

describe('createValidatedClient', () => {
  it('should create clients for all tables', () => {
    const supabase = createClient('', '');
    const client = createValidatedClient(supabase);

    expect(client.posts).toBeInstanceOf(ValidatedQueryBuilder);
    expect(client.profiles).toBeInstanceOf(ValidatedQueryBuilder);
    expect(client.tags).toBeInstanceOf(ValidatedQueryBuilder);
    expect(client.users).toBeInstanceOf(ValidatedQueryBuilder);
  });
});

describe('validateExists', () => {
  it('should return true if row exists', async () => {
    const supabase = createClient('', '');
    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
    }));

    const exists = await validateExists(supabase, 'posts', '123');
    expect(exists).toBe(true);
  });

  it('should return false if row does not exist', async () => {
    const supabase = createClient('', '');
    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }));

    const exists = await validateExists(supabase, 'posts', '123');
    expect(exists).toBe(false);
  });
});

describe('validateUnique', () => {
  it('should return true if value is unique', async () => {
    const supabase = createClient('', '');
    const mockQuery = {
      data: [],
      error: null,
    };

    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(Promise.resolve(mockQuery)),
    }));

    const isUnique = await validateUnique(
      supabase,
      'users',
      'username',
      'john_doe'
    );
    expect(isUnique).toBe(true);
  });

  it('should return false if value already exists', async () => {
    const supabase = createClient('', '');
    const mockQuery = {
      data: [{ id: '123' }],
      error: null,
    };

    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(Promise.resolve(mockQuery)),
    }));

    const isUnique = await validateUnique(
      supabase,
      'users',
      'username',
      'john_doe'
    );
    expect(isUnique).toBe(false);
  });

  it('should exclude specific ID when checking uniqueness', async () => {
    const supabase = createClient('', '');
    const neqMock = vi
      .fn()
      .mockReturnValue(Promise.resolve({ data: [], error: null }));

    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: neqMock,
    }));

    await validateUnique(supabase, 'users', 'username', 'john_doe', '456');
    expect(neqMock).toHaveBeenCalledWith('id', '456');
  });
});

describe('validateManyExist', () => {
  it('should return valid and invalid IDs', async () => {
    const supabase = createClient('', '');
    const mockQuery = {
      data: [{ id: '123' }, { id: '456' }],
      error: null,
    };

    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnValue(Promise.resolve(mockQuery)),
    }));

    const ids = ['123', '456', '789'];
    const result = await validateManyExist(supabase, 'posts', ids);

    expect(result.valid).toEqual(['123', '456']);
    expect(result.invalid).toEqual(['789']);
  });

  it('should handle errors gracefully', async () => {
    const supabase = createClient('', '');
    const mockQuery = {
      data: null,
      error: new Error('Database error'),
    };

    supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnValue(Promise.resolve(mockQuery)),
    }));

    const ids = ['123', '456'];
    const result = await validateManyExist(supabase, 'posts', ids);

    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual(['123', '456']);
  });
});
