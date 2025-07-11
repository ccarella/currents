'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePostsService } from '@/lib/posts-context';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Database } from '@/types/database.types';

type PostWithProfile = Database['public']['Tables']['posts']['Row'] & {
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export default function PostList() {
  const postsService = usePostsService();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      setError(null);
      const { posts: newPosts, hasMore: moreAvailable } =
        await postsService.getActivePostsPaginated(page, 20);

      if (page === 1) {
        setPosts(newPosts as PostWithProfile[]);
      } else {
        setPosts((prev) => [...prev, ...(newPosts as PostWithProfile[])]);
      }

      setHasMore(moreAvailable);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError('Failed to load more posts');
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, postsService]);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const { posts: initialPosts, hasMore: moreAvailable } =
          await postsService.getActivePostsPaginated(1, 20);
        setPosts(initialPosts as PostWithProfile[]);
        setHasMore(moreAvailable);
        setPage(2);
      } catch (err) {
        setError('Something went wrong');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, [postsService]);

  useInfiniteScroll(loadMore);

  if (loading) {
    const skeletonCount = 3;
    return (
      <div className="space-y-4" role="status" aria-label="Loading posts">
        {[...Array(skeletonCount)].map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
        <p className="text-red-500 mb-2">Something went wrong</p>
        <p className="text-gray-500 text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-center px-4">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600 mb-4">
          Be the first to share something with the community!
        </p>
        <Link
          href="/write"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {loadingMore && (
        <LoadingSpinner
          size="sm"
          className="py-4"
          label="Loading more posts..."
        />
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more posts to load
        </div>
      )}
    </div>
  );
}
