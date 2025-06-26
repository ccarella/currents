'use client';

import { PostList } from '@/components/post';
import { PostsServiceProvider } from '@/lib/posts-context';

export default function PostFeed() {
  return (
    <PostsServiceProvider>
      <PostList />
    </PostsServiceProvider>
  );
}
