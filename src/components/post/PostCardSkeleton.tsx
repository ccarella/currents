import { Skeleton } from '@/components/ui/Skeleton';

export default function PostCardSkeleton() {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-24 mt-1" />
          <Skeleton className="h-6 w-3/4 mt-3" />
          <div className="space-y-2 mt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    </article>
  );
}
