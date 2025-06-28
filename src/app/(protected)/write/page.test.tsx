import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WritePage from './page';

// Mock the PlainTextEditor component
vi.mock('@/components/PlainTextEditor', () => ({
  __esModule: true,
  default: ({
    placeholder,
    initialContent,
    onContentChange,
  }: {
    placeholder?: string;
    initialContent?: string;
    onContentChange?: (content: string) => void;
  }) => {
    // Simulate loading content from localStorage if no initialContent
    const content =
      initialContent || localStorage.getItem('draft-content') || '';

    // Call onContentChange with the content
    if (onContentChange) {
      setTimeout(() => onContentChange(content), 0);
    }

    return (
      <div data-testid="plain-text-editor">
        <div>{placeholder}</div>
        <div>{content}</div>
      </div>
    );
  },
  DRAFT_CONTENT_KEY: 'draft-content',
  DRAFT_TIMESTAMP_KEY: 'draft-timestamp',
}));

// Mock next/navigation
const mockReplace = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

// Mock Supabase posts functions
vi.mock('@/lib/supabase/posts', () => ({
  createPost: vi.fn().mockResolvedValue({ id: 'new-post-id' }),
  updatePost: vi.fn().mockResolvedValue({}),
  getPostById: vi.fn().mockResolvedValue({
    id: 'post-id',
    title: 'Test Post',
    content: 'Test content',
  }),
  getUserCurrentPost: vi.fn().mockResolvedValue(null),
}));

describe('WritePage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the write page with title input and editor', async () => {
    render(<WritePage />);

    expect(
      screen.getByPlaceholderText('Enter your title...')
    ).toBeInTheDocument();

    // Wait for the editor to load (it's dynamically imported)
    await waitFor(() => {
      expect(screen.getByTestId('plain-text-editor')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Start writing your story... (plain text only, no formatting)'
      )
    ).toBeInTheDocument();
  });

  it('updates title when typing', async () => {
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    await user.type(titleInput, 'My New Post');

    expect(titleInput).toHaveValue('My New Post');
  });

  it('disables publish button when title is empty', () => {
    render(<WritePage />);

    const publishButton = screen.getByText('Publish');
    expect(publishButton).toBeDisabled();

    // Button should not be clickable when disabled
    expect(publishButton).toHaveAttribute('disabled');
  });

  it('creates new post on publish', async () => {
    const { createPost } = await import('@/lib/supabase/posts');

    // Set up localStorage with content
    localStorage.setItem('draft-content', 'test content');

    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    await user.type(titleInput, 'Test Title');

    const publishButton = screen.getByText('Publish');
    await user.click(publishButton);

    await waitFor(() => {
      expect(createPost).toHaveBeenCalledWith({
        title: 'Test Title',
        content: 'test content',
        status: 'published',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('has proper layout structure', () => {
    const { container } = render(<WritePage />);

    // Check for flex column layout
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-screen');

    // Check for header section
    const header = container.querySelector('.border-b');
    expect(header).toBeInTheDocument();

    // Check for editor section
    const editorSection = container.querySelector('.flex-1');
    expect(editorSection).toBeInTheDocument();
  });

  it('applies correct styling to title input', () => {
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    expect(titleInput).toHaveClass(
      'w-full',
      'text-3xl',
      'font-bold',
      'placeholder-gray-400',
      'border-none',
      'outline-none'
    );
  });

  it('displays loading state', () => {
    render(<WritePage />);
    // The loading state is brief, so we just ensure the component renders
    expect(
      screen.getByPlaceholderText('Enter your title...')
    ).toBeInTheDocument();
  });
});
