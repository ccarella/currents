// Re-export schemas from the centralized location
export {
  CreatePostSchema as createPostSchema,
  PaginationSchema as paginationSchema,
  type CreatePost as CreatePostInput,
  type Pagination as PaginationInput,
} from '@/types/schemas';
