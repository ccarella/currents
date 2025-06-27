'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Database } from '@/types/database.generated';
import ShareButton from '@/components/ui/ShareButton';
import { PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
};

interface PostViewProps {
  post: Post;
  profile: Profile;
}

export default function PostView({ post }: PostViewProps) {
  const [isOwner, setIsOwner] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkOwnership() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.id === post.author_id) {
        setIsOwner(true);
      }
    }
    checkOwnership();
  }, [post.author_id, supabase.auth]);

  const publishedDate = post.published_at
    ? format(new Date(post.published_at), 'MMMM d, yyyy')
    : format(new Date(post.created_at), 'MMMM d, yyyy');

  return (
    <article className="bg-white rounded-lg shadow-sm">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {post.profiles.avatar_url && (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.full_name || post.profiles.username || ''}
                className="w-10 h-10 rounded-full"
                loading="lazy"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {post.profiles.full_name || post.profiles.username}
              </p>
              <p className="text-sm text-gray-500">@{post.profiles.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShareButton
              url={`/${post.profiles.username}`}
              title={post.title || `Post by ${post.profiles.username}`}
              text={post.excerpt || 'Check out this post on Currents'}
            />
            {isOwner && (
              <Link
                href={`/write?id=${post.id}`}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <PencilIcon className="w-4 h-4 mr-1.5" />
                Edit
              </Link>
            )}
          </div>
        </div>
        {post.title && (
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {post.title}
          </h1>
        )}
        <p className="mt-1 text-sm text-gray-500">{publishedDate}</p>
      </div>

      {/* Post Content */}
      <div className="prose prose-lg max-w-none p-6">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-2 mb-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2 mb-4">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-gray-700">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-900 text-gray-100 rounded p-4 overflow-x-auto font-mono text-sm">
                  {children}
                </code>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
