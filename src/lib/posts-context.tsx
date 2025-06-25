'use client';

import { createContext, useContext, ReactNode } from 'react';
import { PostsService } from '@/lib/posts';
import { createClient } from '@/lib/supabase/client';

const PostsServiceContext = createContext<PostsService | null>(null);

export function PostsServiceProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const postsService = new PostsService(supabase);

  return (
    <PostsServiceContext.Provider value={postsService}>
      {children}
    </PostsServiceContext.Provider>
  );
}

export function usePostsService() {
  const context = useContext(PostsServiceContext);
  if (!context) {
    throw new Error(
      'usePostsService must be used within a PostsServiceProvider'
    );
  }
  return context;
}
