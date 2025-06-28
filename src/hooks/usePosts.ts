import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { PostsService } from '@/lib/posts';
import { createClient } from '@/lib/supabase/client';
import { createPost, updatePost } from '@/lib/supabase/posts';
import type { Database } from '@/types/database.types';

type Post = Database['public']['Tables']['posts']['Row'];
type PostWithProfile = Post & {
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Hook for paginated posts with infinite scrolling
export function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: postKeys.lists(),
    queryFn: async ({ pageParam = 1 }) => {
      const supabase = createClient();
      const postsService = new PostsService(supabase);
      const { posts } = await postsService.getActivePostsPaginated(
        pageParam,
        20
      );
      return posts as PostWithProfile[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than 20 items, we've reached the end
      if (lastPage.length < 20) return undefined;
      // Otherwise, return the next page number
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

// Hook for creating posts with optimistic updates
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onMutate: async (newPost) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(postKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(postKeys.lists(), (old) => {
        if (!old || typeof old !== 'object' || !('pages' in old)) return old;
        // Add the new post to the beginning of the first page
        const oldData = old as { pages: Post[][]; pageParams: unknown[] };
        const newPages = [...oldData.pages];
        if (newPages[0]) {
          newPages[0] = [newPost as Post, ...newPages[0]];
        }
        return { ...oldData, pages: newPages };
      });

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (_err, _newPost, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(postKeys.lists(), context?.previousPosts);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

// Hook for updating posts
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Post> }) => {
      // Filter out null values and only include allowed fields
      const cleanUpdates: Parameters<typeof updatePost>[1] = {};
      if (updates.title !== undefined && updates.title !== null) {
        cleanUpdates.title = updates.title;
      }
      if (updates.content !== undefined && updates.content !== null) {
        cleanUpdates.content = updates.content;
      }
      if (updates.status !== undefined && updates.status !== null) {
        cleanUpdates.status = updates.status;
      }
      return updatePost(id, cleanUpdates);
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      // Invalidate specific post detail
      queryClient.invalidateQueries({
        queryKey: postKeys.detail(variables.id),
      });
    },
  });
}

// Hook for deleting posts
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const postsService = new PostsService(supabase);
      await postsService.deletePost(postId);
    },
    onSuccess: () => {
      // Invalidate and refetch posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
