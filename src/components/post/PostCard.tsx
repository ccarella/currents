import OptimizedImage from '@/components/OptimizedImage';
import type { Database } from '@/types/database.types';

type PostWithProfile = Database['public']['Tables']['posts']['Row'] & {
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

interface PostCardProps {
  post: PostWithProfile;
}

export default function PostCard({ post }: PostCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {post.profiles.avatar_url ? (
            <OptimizedImage
              className="h-10 w-10 rounded-full"
              src={post.profiles.avatar_url}
              alt={post.profiles.full_name || post.profiles.username}
              width={40}
              height={40}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {(post.profiles.full_name || post.profiles.username)
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {post.profiles.full_name || post.profiles.username}
            </p>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
          <p className="text-sm text-gray-500">@{post.profiles.username}</p>
          {post.title && (
            <h3 className="mt-3 text-lg font-semibold text-gray-900">
              {post.title}
            </h3>
          )}
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
      </div>
    </article>
  );
}
