import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  validate,
  validateOrThrow,
  safeParse,
  formatZodErrors,
  validateRequestBody,
  validateQueryParams,
  createValidationErrorResponse,
  isZodError,
  stripUnknownProperties,
  partialValidate,
  validateArray,
  createPaginatedResponseSchema,
  validateEnv,
} from '../index';

const testSchema = z.object({
  name: z.string().min(3),
  age: z.number().positive(),
  email: z.string().email().optional(),
});

describe('validate', () => {
  it('should return success with valid data', () => {
    const result = validate(testSchema, {
      name: 'John',
      age: 25,
      email: 'john@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: 'John',
      age: 25,
      email: 'john@example.com',
    });
    expect(result.errors).toBeUndefined();
  });

  it('should return errors with invalid data', () => {
    const result = validate(testSchema, {
      name: 'Jo',
      age: -5,
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toHaveLength(3);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: expect.stringContaining('at least 3'),
    });
  });
});

describe('validateOrThrow', () => {
  it('should return parsed data when valid', () => {
    const data = validateOrThrow(testSchema, {
      name: 'John',
      age: 25,
    });

    expect(data).toEqual({
      name: 'John',
      age: 25,
    });
  });

  it('should throw ZodError when invalid', () => {
    expect(() =>
      validateOrThrow(testSchema, {
        name: 'Jo',
        age: -5,
      })
    ).toThrow();
  });
});

describe('safeParse', () => {
  it('should return success result when valid', () => {
    const result = safeParse(testSchema, {
      name: 'John',
      age: 25,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'John',
        age: 25,
      });
    }
  });

  it('should return error result when invalid', () => {
    const result = safeParse(testSchema, {
      name: 'Jo',
      age: -5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('formatZodErrors', () => {
  it('should format nested errors correctly', () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(3),
        }),
      }),
    });

    try {
      nestedSchema.parse({ user: { profile: { name: 'a' } } });
    } catch (error) {
      const errors = formatZodErrors(error as z.ZodError);
      expect(errors).toContainEqual({
        field: 'user.profile.name',
        message: expect.any(String),
      });
    }
  });
});

describe('validateRequestBody', () => {
  it('should validate valid JSON body', async () => {
    const request = new NextRequest('https://example.com', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John',
        age: 25,
      }),
    });

    const result = await validateRequestBody(request, testSchema);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: 'John',
      age: 25,
    });
  });

  it('should handle invalid JSON', async () => {
    const request = new NextRequest('https://example.com', {
      method: 'POST',
      body: 'invalid json',
    });

    const result = await validateRequestBody(request, testSchema);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      { field: 'body', message: 'Invalid JSON in request body' },
    ]);
  });

  it('should validate and return errors for invalid data', async () => {
    const request = new NextRequest('https://example.com', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Jo',
        age: -5,
      }),
    });

    const result = await validateRequestBody(request, testSchema);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('validateQueryParams', () => {
  it('should validate query parameters', () => {
    const request = new NextRequest('https://example.com?page=1&limit=20');
    const querySchema = z.object({
      page: z.coerce.number(),
      limit: z.coerce.number(),
    });

    const result = validateQueryParams(request, querySchema);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('should handle array parameters', () => {
    const request = new NextRequest('https://example.com?tags=1&tags=2&tags=3');
    const querySchema = z.object({
      tags: z.array(z.string()),
    });

    const result = validateQueryParams(request, querySchema);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      tags: ['1', '2', '3'],
    });
  });
});

describe('createValidationErrorResponse', () => {
  it('should create error response with default status', () => {
    const errors = [
      { field: 'name', message: 'Too short' },
      { field: 'age', message: 'Must be positive' },
    ];

    const response = createValidationErrorResponse(errors);
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should create error response with custom status', () => {
    const errors = [{ field: 'auth', message: 'Unauthorized' }];
    const response = createValidationErrorResponse(errors, 401);
    expect(response.status).toBe(401);
  });
});

describe('isZodError', () => {
  it('should identify ZodError correctly', () => {
    try {
      testSchema.parse({ name: 'a' });
    } catch (error) {
      expect(isZodError(error)).toBe(true);
    }

    expect(isZodError(new Error('Regular error'))).toBe(false);
    expect(isZodError('string')).toBe(false);
    expect(isZodError(null)).toBe(false);
  });
});

describe('stripUnknownProperties', () => {
  it('should remove unknown properties', () => {
    const data = {
      name: 'John',
      age: 25,
      unknownField: 'should be removed',
    };

    const stripped = stripUnknownProperties(testSchema, data);
    expect(stripped).toEqual({
      name: 'John',
      age: 25,
    });
    expect(stripped).not.toHaveProperty('unknownField');
  });
});

describe('partialValidate', () => {
  it('should validate partial objects', () => {
    const result = partialValidate(testSchema, { name: 'John' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John' });
  });

  it('should still validate constraints on provided fields', () => {
    const result = partialValidate(testSchema, { name: 'Jo' });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

describe('validateArray', () => {
  it('should validate array of items', () => {
    const itemSchema = z.object({ id: z.number(), name: z.string() });
    const data = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    const result = validateArray(itemSchema, data);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('should fail if any item is invalid', () => {
    const itemSchema = z.object({ id: z.number(), name: z.string() });
    const data = [
      { id: 1, name: 'Item 1' },
      { id: 'invalid', name: 'Item 2' },
    ];

    const result = validateArray(itemSchema, data);
    expect(result.success).toBe(false);
  });
});

describe('createPaginatedResponseSchema', () => {
  it('should create valid paginated response schema', () => {
    const itemSchema = z.object({ id: z.number(), name: z.string() });
    const paginatedSchema = createPaginatedResponseSchema(itemSchema);

    const validResponse = {
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      },
    };

    expect(() => paginatedSchema.parse(validResponse)).not.toThrow();
  });
});

describe('validateEnv', () => {
  it('should validate environment variables', () => {
    const envSchema = z.object({
      NODE_ENV: z.enum(['development', 'test', 'production']),
      TEST_VAR: z.string(),
    });

    const originalEnv = process.env;
    process.env = {
      NODE_ENV: 'test',
      TEST_VAR: 'test-value',
    };

    const result = validateEnv(envSchema);
    expect(result).toEqual({
      NODE_ENV: 'test',
      TEST_VAR: 'test-value',
    });

    process.env = originalEnv;
  });

  it('should throw on invalid environment variables', () => {
    const envSchema = z.object({
      REQUIRED_VAR: z.string(),
    });

    const originalEnv = process.env;
    process.env = {};

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => validateEnv(envSchema)).toThrow(
      'Invalid environment variables'
    );

    consoleSpy.mockRestore();
    process.env = originalEnv;
  });
});
