'use client';

import PlainTextEditor, {
  DRAFT_CONTENT_KEY,
  DRAFT_TIMESTAMP_KEY,
} from '@/components/PlainTextEditor';
import { useState, useEffect, useRef, useCallback } from 'react';
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

// Utility function to extract error messages
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'object' && err !== null) {
    const error = err as {
      message?: string;
      error?: { message?: string };
      code?: string;
    };

    if (error.message) {
      return error.message;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.code === '23505') {
      return 'A post with this title already exists. Please try a different title.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

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

  // Track component mount state to prevent memory leaks
  const isMountedRef = useRef(true);

  // Load existing post if editing
  useEffect(() => {
    const abortController = new AbortController();

    if (postId) {
      setIsLoading(true);
      getPostById(postId)
        .then((post) => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            setTitle(post.title);
            setContent(post.content || '');
            setCurrentPostId(post.id);
          }
        })
        .catch((err) => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            setError('Failed to load post');
            console.error('Error loading post:', err);
          }
        })
        .finally(() => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      abortController.abort();
    };
  }, [postId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const publishPost = useCallback(
    async (editorContent: string) => {
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
        if (typeof window !== 'undefined') {
          localStorage.removeItem(DRAFT_CONTENT_KEY);
          localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
        }

        // Show success and redirect
        if (isMountedRef.current) {
          router.push('/');
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error publishing post:', err);
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMountedRef.current) {
          setIsPublishing(false);
        }
      }
    },
    [currentPostId, title, router]
  );

  const handlePublish = useCallback(
    async (editorContent: string) => {
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

        if (isMountedRef.current) {
          if (
            currentPost &&
            (!currentPostId || currentPostId !== currentPost.id)
          ) {
            // User has an existing post that's not the one being edited
            setExistingPost({ id: currentPost.id, title: currentPost.title });
            setShowReplaceDialog(true);
            return;
          }

          // No existing post or editing the same post, proceed with publish
          await publishPost(editorContent);
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error checking existing post:', err);
          setError('Failed to check existing posts. Please try again.');
        }
      }
    },
    [title, currentPostId, publishPost]
  );

  const handleReplace = useCallback(async () => {
    setShowReplaceDialog(false);
    await publishPost(pendingContent);
  }, [pendingContent, publishPost]);

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
                    typeof window !== 'undefined'
                      ? localStorage.getItem(DRAFT_CONTENT_KEY) || content
                      : content;
                  handlePublish(editorContent);
                }}
                disabled={!title.trim() || isPublishing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                aria-label={isPublishing ? 'Publishing...' : 'Publish post'}
              >
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <PlainTextEditor
            initialContent={content}
            placeholder="Start writing your story..."
          />
        </div>
      </div>

      {/* Replace Post Confirmation Dialog */}
      <Dialog
        open={showReplaceDialog}
        onClose={() => setShowReplaceDialog(false)}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>
            <span id="dialog-title">Replace Your Current Post?</span>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div id="dialog-description">
            <p>You can only have one published post at a time.</p>
            <p className="mt-2">
              Your current post{' '}
              <strong>&ldquo;{existingPost?.title}&rdquo;</strong> will be
              replaced with this new post.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <button
            onClick={() => setShowReplaceDialog(false)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Cancel post replacement"
          >
            Cancel
          </button>
          <button
            onClick={handleReplace}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Confirm post replacement"
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
