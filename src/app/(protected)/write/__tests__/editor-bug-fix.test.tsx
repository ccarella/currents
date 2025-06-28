import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WritePage from '../page';
import { useRouter, useSearchParams } from 'next/navigation';
import * as postsLib from '@/lib/supabase/posts';
import type { Database } from '@/types/database.generated';
import React from 'react';

type Post = Database['public']['Tables']['posts']['Row'];

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock Supabase posts functions
vi.mock('@/lib/supabase/posts', () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
  getPostById: vi.fn(),
  getUserCurrentPost: vi.fn(),
}));

// Mock the PlainTextEditor to verify it receives initialContent
vi.mock('@/components/PlainTextEditor', () => ({
  default: ({
    initialContent,
    placeholder,
  }: {
    initialContent?: string;
    placeholder: string;
    onContentChange?: (content: string) => void;
  }) => {
    // Verify that initialContent is passed correctly
    return (
      <div>
        <div data-testid="editor-initial-content">{initialContent}</div>
        <textarea
          data-testid="plain-text-editor"
          placeholder={placeholder}
          defaultValue={initialContent}
        />
      </div>
    );
  },
  DRAFT_CONTENT_KEY: 'draft-content',
  DRAFT_TIMESTAMP_KEY: 'draft-timestamp',
}));

describe('Editor Bug Fix - Load Existing Content', () => {
  const mockPush = vi.fn();
  const mockGet = vi.fn();

  const mockPost: Post = {
    id: 'test-post-id',
    title: 'My Existing Post',
    content:
      'This is my existing post content that should be loaded in the editor.',
    status: 'published',
    author_id: 'user-id',
    slug: 'my-existing-post',
    excerpt: 'This is my existing post content excerpt',
    published_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
      getAll: vi.fn(),
      has: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      toString: vi.fn(),
      size: 0,
      [Symbol.iterator]: vi.fn(),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  it('should load existing post content into the editor when editing', async () => {
    // Setup: Simulate editing an existing post
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);

    // Act: Render the WritePage
    render(<WritePage />);

    // Assert: Verify loading state appears first
    expect(screen.getByText('Loading post...')).toBeInTheDocument();

    // Assert: Wait for the post to load and verify content
    await waitFor(() => {
      // Title should be loaded
      expect(screen.getByDisplayValue('My Existing Post')).toBeInTheDocument();

      // Editor should receive the existing content as initialContent
      expect(screen.getByTestId('editor-initial-content')).toHaveTextContent(
        'This is my existing post content that should be loaded in the editor.'
      );

      // Textarea should have the content
      const textarea = screen.getByTestId(
        'plain-text-editor'
      ) as HTMLTextAreaElement;
      expect(textarea.defaultValue).toBe(
        'This is my existing post content that should be loaded in the editor.'
      );

      // Should show "Update Post" button instead of "Publish"
      expect(screen.getByText('Update Post')).toBeInTheDocument();
      expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    });
  });

  it('should not load draft content when editing an existing post', async () => {
    // Setup: Set a draft in localStorage
    localStorage.setItem(
      'draft-content',
      'This is draft content that should NOT be loaded'
    );
    localStorage.setItem('draft-timestamp', new Date().toISOString());

    // Simulate editing an existing post
    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(mockPost);

    // Act: Render the WritePage
    render(<WritePage />);

    // Assert: Wait for the post to load
    await waitFor(() => {
      // Editor should receive the existing post content, NOT the draft
      expect(screen.getByTestId('editor-initial-content')).toHaveTextContent(
        'This is my existing post content that should be loaded in the editor.'
      );

      // Draft should NOT be visible
      expect(
        screen.queryByText('This is draft content that should NOT be loaded')
      ).not.toBeInTheDocument();

      // Draft should be cleared from localStorage
      expect(localStorage.getItem('draft-content')).toBeNull();
      expect(localStorage.getItem('draft-timestamp')).toBeNull();
    });
  });

  it('should handle empty content gracefully', async () => {
    // Setup: Post with empty content
    const postWithEmptyContent = {
      ...mockPost,
      content: '',
    };

    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(postWithEmptyContent);

    // Act: Render the WritePage
    render(<WritePage />);

    // Assert: Wait for the post to load
    await waitFor(() => {
      // Title should be loaded
      expect(screen.getByDisplayValue('My Existing Post')).toBeInTheDocument();

      // Editor should receive empty string as initialContent
      expect(screen.getByTestId('editor-initial-content')).toHaveTextContent(
        ''
      );

      // Textarea should be empty
      const textarea = screen.getByTestId(
        'plain-text-editor'
      ) as HTMLTextAreaElement;
      expect(textarea.defaultValue).toBe('');
    });
  });

  it('should handle null content gracefully', async () => {
    // Setup: Post with null content
    const postWithNullContent = {
      ...mockPost,
      content: null,
    };

    mockGet.mockReturnValue('test-post-id');
    vi.mocked(postsLib.getPostById).mockResolvedValue(postWithNullContent);

    // Act: Render the WritePage
    render(<WritePage />);

    // Assert: Wait for the post to load
    await waitFor(() => {
      // Title should be loaded
      expect(screen.getByDisplayValue('My Existing Post')).toBeInTheDocument();

      // Editor should receive empty string as initialContent (null is converted to '')
      expect(screen.getByTestId('editor-initial-content')).toHaveTextContent(
        ''
      );

      // Textarea should be empty
      const textarea = screen.getByTestId(
        'plain-text-editor'
      ) as HTMLTextAreaElement;
      expect(textarea.defaultValue).toBe('');
    });
  });
});
