import { ZodSchema } from 'zod';
import { Database } from '@/types/database.generated';
import { SupabaseClient } from '@supabase/supabase-js';
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
  ProfileQuerySchema,
  TagQuerySchema,
  type CreatePost,
  type UpdatePost,
  type CreateProfile,
  type UpdateProfile,
  type CreateTag,
  type UpdateTag,
  type CreateUser,
  type UpdateUser,
} from '@/types/schemas';

/**
 * Validates and transforms data before inserting into the database
 */
export function validateInsert<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validates and transforms data before updating in the database
 */
export function validateUpdate<T>(
  schema: ZodSchema<T>,
  data: unknown
): Partial<T> {
  // For updates, we expect the schema to already be partial
  // This is handled by using UpdatePostSchema, UpdateProfileSchema, etc.
  return schema.parse(data) as Partial<T>;
}

/**
 * Database operation validators
 */
export const dbValidators = {
  posts: {
    create: (data: unknown): CreatePost => CreatePostSchema.parse(data),
    update: (data: unknown): Partial<UpdatePost> =>
      UpdatePostSchema.parse(data),
    query: (params: unknown) => PostQuerySchema.parse(params),
  },
  profiles: {
    create: (data: unknown): CreateProfile => CreateProfileSchema.parse(data),
    update: (data: unknown): UpdateProfile => UpdateProfileSchema.parse(data),
    query: (params: unknown) => ProfileQuerySchema.parse(params),
  },
  tags: {
    create: (data: unknown): CreateTag => CreateTagSchema.parse(data),
    update: (data: unknown): UpdateTag => UpdateTagSchema.parse(data),
    query: (params: unknown) => TagQuerySchema.parse(params),
  },
  users: {
    create: (data: unknown): CreateUser => CreateUserSchema.parse(data),
    update: (data: unknown): UpdateUser => UpdateUserSchema.parse(data),
  },
} as const;

/**
 * Type-safe database query builder with validation
 */
export class ValidatedQueryBuilder<
  T extends keyof Database['public']['Tables'],
> {
  constructor(
    private supabase: SupabaseClient<Database>,
    private table: T
  ) {}

  async create(data: unknown) {
    const validators = dbValidators[this.table as keyof typeof dbValidators];
    if (!validators || !('create' in validators)) {
      throw new Error(`No create validator found for table ${this.table}`);
    }

    const validatedData = validators.create(data);
    // Use any to avoid complex type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.supabase.from(this.table).insert(validatedData as any);
  }

  async update(id: string, data: unknown) {
    const validators = dbValidators[this.table as keyof typeof dbValidators];
    if (!validators || !('update' in validators)) {
      throw new Error(`No update validator found for table ${this.table}`);
    }

    const validatedData = validators.update(data);
    // Use any to avoid complex type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.supabase.from(this.table).update(validatedData as any).eq('id', id);
  }

  async delete(id: string) {
    return this.supabase.from(this.table).delete().eq('id', id);
  }

  async findById(id: string) {
    return this.supabase.from(this.table).select('*').eq('id', id).single();
  }

  async findMany(params?: unknown) {
    const validators = dbValidators[this.table as keyof typeof dbValidators];
    if (params && validators && 'query' in validators) {
      const validatedParams = validators.query(params);
      let query = this.supabase
        .from(this.table)
        .select('*', { count: 'exact' });

      // Apply pagination
      if ('limit' in validatedParams && 'page' in validatedParams) {
        const offset = (validatedParams.page - 1) * validatedParams.limit;
        query = query.range(offset, offset + validatedParams.limit - 1);
      }

      // Apply sorting
      if ('sort_by' in validatedParams && 'order' in validatedParams) {
        query = query.order(validatedParams.sort_by, {
          ascending: validatedParams.order === 'asc',
        });
      }

      return query;
    }

    return this.supabase.from(this.table).select('*');
  }
}

/**
 * Creates a type-safe, validated database client
 */
export function createValidatedClient(supabase: SupabaseClient<Database>) {
  return {
    posts: new ValidatedQueryBuilder(supabase, 'posts'),
    profiles: new ValidatedQueryBuilder(supabase, 'profiles'),
    tags: new ValidatedQueryBuilder(supabase, 'tags'),
    users: new ValidatedQueryBuilder(supabase, 'users'),
  };
}

/**
 * Validates that a row exists in the database
 */
export async function validateExists<
  T extends keyof Database['public']['Tables'],
>(supabase: SupabaseClient<Database>, table: T, id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .single();

  return !error && !!data;
}

/**
 * Validates unique constraints
 */
export async function validateUnique<
  T extends keyof Database['public']['Tables'],
>(
  supabase: SupabaseClient<Database>,
  table: T,
  field: string,
  value: string,
  excludeId?: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from(table).select('id').eq(field as any, value);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  return !error && (!data || data.length === 0);
}

/**
 * Batch validation for multiple IDs
 */
export async function validateManyExist<
  T extends keyof Database['public']['Tables'],
>(
  supabase: SupabaseClient<Database>,
  table: T,
  ids: string[]
): Promise<{ valid: string[]; invalid: string[] }> {
  const { data, error } = await supabase.from(table).select('id').in('id', ids);

  if (error || !data) {
    return { valid: [], invalid: ids };
  }

  const foundIds = new Set(data.map((row: { id: string }) => row.id));
  const valid = ids.filter((id) => foundIds.has(id));
  const invalid = ids.filter((id) => !foundIds.has(id));

  return { valid, invalid };
}
