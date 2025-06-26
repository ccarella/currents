import { PostList } from '@/components/post';
import { PostsServiceProvider } from '@/lib/posts-context';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Latest Posts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            See what the community is sharing
          </p>
        </header>

        <PostsServiceProvider>
          <PostList />
        </PostsServiceProvider>
      </div>
    </div>
  );
}
