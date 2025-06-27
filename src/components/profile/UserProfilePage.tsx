'use client';

import { Database } from '@/lib/supabase/database.types';
import PostView from '@/components/post/PostView';
import { PostgrestError } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
};

interface UserProfilePageProps {
  profile: Profile;
  post: Post | null;
  postError: PostgrestError | null;
}

export default function UserProfilePage({
  profile,
  post,
  postError,
}: UserProfilePageProps) {
  const hasNoPost = postError?.code === 'PGRST116';
  const hasError = postError && postError.code !== 'PGRST116';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || profile.username}
                className="w-16 h-16 rounded-full"
                loading="lazy"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name || profile.username}
              </h1>
              <p className="text-gray-500">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-2 text-gray-700">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        {hasNoPost ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">
              {profile.username} hasn&apos;t posted anything yet.
            </p>
          </div>
        ) : hasError ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-red-500">
              Error loading post. Please try again later.
            </p>
          </div>
        ) : post ? (
          <PostView post={post} profile={profile} />
        ) : null}
      </div>
    </div>
  );
}
