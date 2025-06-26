import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WritePage from '../page';
import { useRouter, useSearchParams } from 'next/navigation';
import * as postsLib from '@/lib/supabase/posts';
import type { Database } from '@/types/database.generated';

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

// Mock the MarkdownEditor component
vi.mock('@/components/MarkdownEditor', () => ({
  default: ({
    onSave,
    placeholder,
  }: {
    onSave: (content: string) => void;
    placeholder: string;
  }) => (
    <div>
      <textarea
        data-testid="markdown-editor"
        placeholder={placeholder}
        onChange={(e) => {
          localStorage.setItem('draft-content', e.target.value);
        }}
      />
      <button
        onClick={() => onSave(localStorage.getItem('draft-content') || '')}
      >
        Save
      </button>
    </div>
  ),
  DRAFT_CONTENT_KEY: 'draft-content',
  DRAFT_TIMESTAMP_KEY: 'draft-timestamp',
}));

describe('WritePage', () => {
  const mockPush = vi.fn();
  const mockGet = vi.fn();

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
    mockGet.mockReturnValue(null);
  });

  it('renders the page with title input and publish button', () => {
    render(<WritePage />);

    expect(
      screen.getByPlaceholderText('Enter your title...')
    ).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
  });

  it('disables publish button when title is empty', () => {
    render(<WritePage />);

    const publishButton = screen.getByText('Publish');
    expect(publishButton).toBeDisabled();
  });

  it('enables publish button when title is entered', () => {
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'My New Post' } });

    expect(publishButton).not.toBeDisabled();
  });

  it('shows error when trying to publish without content', async () => {
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'My New Post' } });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter some content')).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog when user has an existing post', async () => {
    const existingPost: Post = {
      id: 'existing-id',
      title: 'My Existing Post',
      content: 'Existing content',
      status: 'published',
      author_id: 'user-id',
      slug: 'my-existing-post',
      excerpt: 'Existing content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(existingPost);

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const editor = screen.getByTestId('markdown-editor');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'My New Post' } });
    fireEvent.change(editor, { target: { value: 'New content' } });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(
        screen.getByText('Replace Your Current Post?')
      ).toBeInTheDocument();
      // Check for the dialog content by searching for partial text
      expect(screen.getByText(/Your current post/)).toBeInTheDocument();
      expect(
        screen.getByText(/will be replaced with this new post/)
      ).toBeInTheDocument();
    });
  });

  it('publishes post without confirmation for new users', async () => {
    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(null);
    const newPost: Post = {
      id: 'new-id',
      title: 'My First Post',
      content: 'First post content',
      status: 'published',
      author_id: 'user-id',
      slug: 'my-first-post',
      excerpt: 'First post content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(postsLib.createPost).mockResolvedValue(newPost);

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const editor = screen.getByTestId('markdown-editor');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'My First Post' } });
    fireEvent.change(editor, { target: { value: 'First post content' } });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(postsLib.createPost).toHaveBeenCalledWith({
        title: 'My First Post',
        content: 'First post content',
        status: 'published',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('replaces existing post when user confirms', async () => {
    const existingPost: Post = {
      id: 'existing-id',
      title: 'Old Post',
      content: 'Old content',
      status: 'published',
      author_id: 'user-id',
      slug: 'old-post',
      excerpt: 'Old content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(existingPost);
    const newPost: Post = {
      id: 'new-id',
      title: 'New Post',
      content: 'New content',
      status: 'published',
      author_id: 'user-id',
      slug: 'new-post',
      excerpt: 'New content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(postsLib.createPost).mockResolvedValue(newPost);

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const editor = screen.getByTestId('markdown-editor');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'New Post' } });
    fireEvent.change(editor, { target: { value: 'New content' } });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(
        screen.getByText('Replace Your Current Post?')
      ).toBeInTheDocument();
    });

    const replaceButton = screen.getByText('Replace Post');
    fireEvent.click(replaceButton);

    await waitFor(() => {
      expect(postsLib.createPost).toHaveBeenCalledWith({
        title: 'New Post',
        content: 'New content',
        status: 'published',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('cancels replacement when user clicks cancel', async () => {
    const existingPost: Post = {
      id: 'existing-id',
      title: 'Old Post',
      content: 'Old content',
      status: 'published',
      author_id: 'user-id',
      slug: 'old-post',
      excerpt: 'Old content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(existingPost);

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const editor = screen.getByTestId('markdown-editor');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'New Post' } });
    fireEvent.change(editor, { target: { value: 'New content' } });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(
        screen.getByText('Replace Your Current Post?')
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Replace Your Current Post?')
      ).not.toBeInTheDocument();
    });

    expect(postsLib.createPost).not.toHaveBeenCalled();
  });

  it('shows loading overlay during publishing', async () => {
    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(null);
    const newPost: Post = {
      id: 'new-id',
      title: 'Test Post',
      content: 'Test content',
      status: 'published',
      author_id: 'user-id',
      slug: 'test-post',
      excerpt: 'Test content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create a promise that we can control
    let resolvePublish: (value: Post) => void;
    const publishPromise = new Promise<Post>((resolve) => {
      resolvePublish = resolve;
    });

    vi.mocked(postsLib.createPost).mockImplementation(() => publishPromise);

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const editor = screen.getByTestId('markdown-editor');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'Test Post' } });
    fireEvent.change(editor, { target: { value: 'Test content' } });
    fireEvent.click(publishButton);

    // Wait a moment for the loading state to appear
    await waitFor(() => {
      // Check if the publish button is disabled (indicating loading state)
      expect(publishButton).toBeDisabled();
    });

    // Resolve the promise to complete the publish
    resolvePublish!(newPost);
  });

  it('clears draft from localStorage after successful publish', async () => {
    localStorage.setItem('draft-content', 'Draft content');
    localStorage.setItem('draft-timestamp', Date.now().toString());

    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(null);
    const newPost: Post = {
      id: 'new-id',
      title: 'Test Post',
      content: 'Test content',
      status: 'published',
      author_id: 'user-id',
      slug: 'test-post',
      excerpt: 'Test content excerpt',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(postsLib.createPost).mockResolvedValue(newPost);

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'Test Post' } });
    localStorage.setItem('draft-content', 'Test content');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    expect(localStorage.getItem('draft-content')).toBeNull();
    expect(localStorage.getItem('draft-timestamp')).toBeNull();
  });

  it('displays error message when publish fails', async () => {
    vi.mocked(postsLib.getUserCurrentPost).mockResolvedValue(null);
    vi.mocked(postsLib.createPost).mockRejectedValue(
      new Error('Network error')
    );

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    const editor = screen.getByTestId('markdown-editor');
    const publishButton = screen.getByText('Publish');

    fireEvent.change(titleInput, { target: { value: 'Test Post' } });
    fireEvent.change(editor, { target: { value: 'Test content' } });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
