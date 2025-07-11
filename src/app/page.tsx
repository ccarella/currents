'use client';

import dynamic from 'next/dynamic';

const PostFeed = dynamic(() => import('@/components/post/PostFeed'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-gray-500">Loading...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Latest Posts</h1>
          <p className="mt-2 text-gray-600">
            See what the community is sharing
          </p>
        </header>

        <PostFeed />
      </div>
    </div>
  );
}
