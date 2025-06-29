import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']).default('published'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
