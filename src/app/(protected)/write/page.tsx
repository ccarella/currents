'use client';

import MarkdownEditor, {
  DRAFT_CONTENT_KEY,
  DRAFT_TIMESTAMP_KEY,
} from '@/components/MarkdownEditor';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createPost,
  updatePost,
  getPostById,
  getUserCurrentPost,
} from '@/lib/supabase/posts';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(postId);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [existingPost, setExistingPost] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [pendingContent, setPendingContent] = useState<string>('');

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

  const handlePublish = async (editorContent: string) => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!editorContent.trim()) {
      setError('Please enter some content');
      return;
    }

    setError(null);
    setPendingContent(editorContent);

    try {
      // Check if user has an existing published post
      const currentPost = await getUserCurrentPost();

      if (currentPost && (!currentPostId || currentPostId !== currentPost.id)) {
        // User has an existing post that's not the one being edited
        setExistingPost({ id: currentPost.id, title: currentPost.title });
        setShowReplaceDialog(true);
        return;
      }

      // No existing post or editing the same post, proceed with publish
      await publishPost(editorContent);
    } catch (err) {
      console.error('Error checking existing post:', err);
      setError('Failed to check existing posts. Please try again.');
    }
  };

  const publishPost = async (editorContent: string) => {
    setIsPublishing(true);
    setError(null);

    try {
      if (currentPostId) {
        // Update existing post and publish it
        await updatePost(currentPostId, {
          title,
          content: editorContent,
          status: 'published',
        });
      } else {
        // Create new post as published
        await createPost({
          title,
          content: editorContent,
          status: 'published',
        });
      }

      // Clear localStorage draft after successful publish
      localStorage.removeItem(DRAFT_CONTENT_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);

      // Show success and redirect
      router.push('/');
    } catch (err) {
      console.error('Error publishing post:', err);

      // Extract error message
      let errorMessage = 'Failed to publish post. Please try again.';

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
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReplace = async () => {
    setShowReplaceDialog(false);
    await publishPost(pendingContent);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading post...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
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
              <button
                onClick={() => {
                  const editorContent =
                    localStorage.getItem(DRAFT_CONTENT_KEY) || content;
                  handlePublish(editorContent);
                }}
                disabled={!title.trim() || isPublishing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor
            initialContent={content}
            onSave={handlePublish}
            placeholder="Start writing your story..."
          />
        </div>
      </div>

      {/* Replace Post Confirmation Dialog */}
      <Dialog
        open={showReplaceDialog}
        onClose={() => setShowReplaceDialog(false)}
      >
        <DialogHeader>
          <DialogTitle>Replace Your Current Post?</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p>You can only have one published post at a time.</p>
          <p className="mt-2">
            Your current post{' '}
            <strong>&ldquo;{existingPost?.title}&rdquo;</strong> will be
            replaced with this new post.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            This action cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <button
            onClick={() => setShowReplaceDialog(false)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReplace}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Replace Post
          </button>
        </DialogFooter>
      </Dialog>

      {/* Loading Overlay */}
      <LoadingOverlay show={isPublishing} message="Publishing your post..." />
    </>
  );
}
