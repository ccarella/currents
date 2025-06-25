import { z, ZodError, ZodSchema } from 'zod';
import { NextRequest } from 'next/server';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates data against a Zod schema
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodErrors(error);
      return { success: false, errors };
    }
    throw error;
  }
}

/**
 * Validates data against a Zod schema and throws an error if validation fails
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates data against a Zod schema (doesn't throw)
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): z.SafeParseReturnType<T, T> {
  return schema.safeParse(data);
}

/**
 * Formats Zod errors into a consistent structure
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Validates request body from a NextRequest
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch {
    return {
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON in request body' }],
    };
  }
}

/**
 * Validates query parameters from a NextRequest
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, unknown> = {};

  searchParams.forEach((value, key) => {
    // Handle array parameters (e.g., ?tag_ids=1&tag_ids=2)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });

  return validate(schema, params);
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  status = 400
): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      errors,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Type guard to check if an error is a Zod error
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Strips unknown properties from an object based on a schema
 */
export function stripUnknownProperties<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Partially validates an object (useful for PATCH operations)
 */
export function partialValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<Partial<T>> {
  const partialSchema = (schema as ZodSchema<unknown>).partial();
  return validate(partialSchema, data);
}

/**
 * Validates an array of items
 */
export function validateArray<T>(
  itemSchema: ZodSchema<T>,
  data: unknown[]
): ValidationResult<T[]> {
  const arraySchema = z.array(itemSchema);
  return validate(arraySchema, data);
}

/**
 * Creates a paginated response schema
 */
export function createPaginatedResponseSchema<T>(itemSchema: ZodSchema<T>) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrevious: z.boolean(),
    }),
  });
}

/**
 * Validates environment variables
 */
export function validateEnv<T>(schema: ZodSchema<T>): T {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(formatZodErrors(result.error));
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

// Re-export commonly used items
export { z } from 'zod';
export type { ZodError, ZodSchema } from 'zod';
