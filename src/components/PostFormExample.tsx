import { PostsServiceProvider } from '@/lib/posts-context';
import { PostForm } from '@/components/PostForm';

/**
 * Example usage of PostForm with PostsServiceProvider
 * This demonstrates how to properly use the PostForm component
 * with dependency injection via React Context
 */
export function PostFormExample({ userId }: { userId: string }) {
  return (
    <PostsServiceProvider>
      <div className="max-w-2xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Create a Post</h2>
        <PostForm userId={userId} />
      </div>
    </PostsServiceProvider>
  );
}
