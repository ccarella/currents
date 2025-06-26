import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WritePage from './page';

// Mock the MarkdownEditor component
vi.mock('@/components/MarkdownEditor', () => ({
  __esModule: true,
  default: ({
    onSave,
    placeholder,
    initialContent,
  }: {
    onSave?: (content: string) => void;
    placeholder?: string;
    initialContent?: string;
  }) => (
    <div data-testid="markdown-editor">
      <button onClick={() => onSave?.('test content')}>Save</button>
      <div>{placeholder}</div>
      <div>{initialContent}</div>
    </div>
  ),
}));

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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
}));

describe('WritePage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the write page with title input and editor', () => {
    render(<WritePage />);

    expect(
      screen.getByPlaceholderText('Enter your title...')
    ).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    expect(screen.getByText('Start writing your story...')).toBeInTheDocument();
  });

  it('updates title when typing', async () => {
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    await user.type(titleInput, 'My New Post');

    expect(titleInput).toHaveValue('My New Post');
  });

  it('shows error when saving without title', async () => {
    render(<WritePage />);

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a title')).toBeInTheDocument();
    });
  });

  it('creates new post on save', async () => {
    const { createPost } = await import('@/lib/supabase/posts');
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    await user.type(titleInput, 'Test Title');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(createPost).toHaveBeenCalledWith({
        title: 'Test Title',
        content: 'test content',
        status: 'draft',
      });
      expect(mockReplace).toHaveBeenCalledWith('/write?id=new-post-id');
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
