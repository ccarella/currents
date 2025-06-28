'use client';

import { useCallback, Fragment } from 'react';
import Link from 'next/link';
import { useInfinitePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OptimizedPostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfinitePosts();

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useInfiniteScroll(loadMore);

  if (isLoading) {
    const skeletonCount = 3;
    return (
      <div className="space-y-4" role="status" aria-label="Loading posts">
        {[...Array(skeletonCount)].map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
        <p className="text-red-500 mb-2">Something went wrong</p>
        <p className="text-gray-500 text-sm">
          {error?.message || 'Please try refreshing the page'}
        </p>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page) ?? [];

  if (allPosts.length === 0) {
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No posts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
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
      {data?.pages.map((page, pageIndex) => (
        <Fragment key={pageIndex}>
          {page.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Fragment>
      ))}

      {isFetchingNextPage && (
        <LoadingSpinner
          size="sm"
          className="py-4"
          label="Loading more posts..."
        />
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more posts to load
        </div>
      )}
    </div>
  );
}
