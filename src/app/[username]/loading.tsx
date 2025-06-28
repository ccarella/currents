import { Skeleton } from '@/components/ui/Skeleton';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="mt-6 flex space-x-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <PostCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
