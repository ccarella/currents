'use client';

import MarkdownEditor from '@/components/MarkdownEditor';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPost, updatePost, getPostById } from '@/lib/supabase/posts';

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(postId);

  // Load existing post if editing
  useEffect(() => {
    if (postId) {
      setIsLoading(true);
      getPostById(postId)
        .then((post) => {
          setTitle(post.title);
          setContent(post.content || '');
          setCurrentPostId(post.id);
        })
        .catch((err) => {
          setError('Failed to load post');
          console.error('Error loading post:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [postId]);

  const handleSave = async (editorContent: string) => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!editorContent.trim()) {
      setError('Please enter some content');
      return;
    }

    setError(null);

    try {
      if (currentPostId) {
        // Update existing post and publish it
        await updatePost(currentPostId, {
          title,
          content: editorContent,
          status: 'published',
        });

        // Redirect to homepage after successful save
        router.push('/');
      } else {
        // Create new post as published
        await createPost({
          title,
          content: editorContent,
          status: 'published',
        });

        // Redirect to homepage after successful save
        router.push('/');
      }
    } catch (err) {
      console.error('Error saving post:', err);

      // Extract error message
      let errorMessage = 'Failed to save post. Please try again.';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const error = err as {
          message?: string;
          error?: { message?: string };
          code?: string;
        };
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.code === '23505') {
          errorMessage =
            'A post with this title already exists. Please try a different title.';
        }
      }

      setError(errorMessage);
      throw err; // Re-throw to let MarkdownEditor handle the error state
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading post...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your title..."
            className="w-full text-3xl font-bold placeholder-gray-400 border-none outline-none"
            aria-label="Post title"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          initialContent={content}
          onSave={handleSave}
          placeholder="Start writing your story..."
        />
      </div>
    </div>
  );
}
