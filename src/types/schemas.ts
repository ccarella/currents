import { z } from 'zod';

// ========== Common Schemas ==========
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url().nullable();
export const timestampSchema = z.string().datetime({ offset: true });
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
  message: 'Slug must contain only lowercase letters, numbers, and hyphens',
});

// ========== Profile Schemas ==========
export const CreateProfileSchema = z.object({
  id: uuidSchema,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Username must contain only letters, numbers, underscores, and hyphens',
    })
    .nullable(),
  full_name: z.string().min(1).max(100).nullable(),
  bio: z.string().max(500).nullable(),
  avatar_url: urlSchema,
});

export const UpdateProfileSchema = CreateProfileSchema.partial().omit({
  id: true,
});

export const ProfileResponseSchema = CreateProfileSchema.extend({
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

// ========== Post Schemas ==========
export const PostStatusSchema = z.enum(['draft', 'published', 'archived']);

export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1).max(10000).nullable(),
  excerpt: z.string().max(500).nullable(),
  status: PostStatusSchema.default('draft'),
  slug: slugSchema,
  author_id: uuidSchema,
  published_at: timestampSchema.nullable(),
});

export const UpdatePostSchema = CreatePostSchema.partial().omit({
  author_id: true,
});

export const PostResponseSchema = CreatePostSchema.extend({
  id: uuidSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

// ========== Tag Schemas ==========
export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: slugSchema,
});

export const UpdateTagSchema = CreateTagSchema.partial();

export const TagResponseSchema = CreateTagSchema.extend({
  id: uuidSchema,
  created_at: timestampSchema,
});

// ========== Post-Tag Relationship Schemas ==========
export const CreatePostTagSchema = z.object({
  post_id: uuidSchema,
  tag_id: uuidSchema,
});

export const PostTagsSchema = z.object({
  post_id: uuidSchema,
  tag_ids: z.array(uuidSchema),
});

// ========== User Schemas ==========
export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Username must contain only letters, numbers, underscores, and hyphens',
    }),
  email: emailSchema,
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const UserResponseSchema = CreateUserSchema.extend({
  id: uuidSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

// ========== Query Parameter Schemas ==========
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const PostQuerySchema = PaginationSchema.extend({
  status: PostStatusSchema.optional(),
  author_id: uuidSchema.optional(),
  tag_ids: z.array(uuidSchema).optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'published_at', 'title'])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const ProfileQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'username'])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const TagQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'name']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// ========== Batch Operation Schemas ==========
export const BatchCreatePostsSchema = z.object({
  posts: z.array(CreatePostSchema).min(1).max(100),
});

export const BatchUpdatePostsSchema = z.object({
  updates: z
    .array(
      z.object({
        id: uuidSchema,
        data: UpdatePostSchema,
      })
    )
    .min(1)
    .max(100),
});

export const BatchDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
});

// ========== Type Exports ==========
export type CreateProfile = z.infer<typeof CreateProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export type CreatePost = z.infer<typeof CreatePostSchema>;
export type UpdatePost = z.infer<typeof UpdatePostSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;

export type CreateTag = z.infer<typeof CreateTagSchema>;
export type UpdateTag = z.infer<typeof UpdateTagSchema>;
export type TagResponse = z.infer<typeof TagResponseSchema>;

export type CreatePostTag = z.infer<typeof CreatePostTagSchema>;
export type PostTags = z.infer<typeof PostTagsSchema>;

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type PostQuery = z.infer<typeof PostQuerySchema>;
export type ProfileQuery = z.infer<typeof ProfileQuerySchema>;
export type TagQuery = z.infer<typeof TagQuerySchema>;

export type BatchCreatePosts = z.infer<typeof BatchCreatePostsSchema>;
export type BatchUpdatePosts = z.infer<typeof BatchUpdatePostsSchema>;
export type BatchDelete = z.infer<typeof BatchDeleteSchema>;
