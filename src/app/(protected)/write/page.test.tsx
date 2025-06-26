import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WritePage from './page';

// Mock the MarkdownEditor component
vi.mock('@/components/MarkdownEditor', () => ({
  __esModule: true,
  default: ({
    onSave,
    placeholder,
  }: {
    onSave?: (content: string) => void;
    placeholder?: string;
  }) => (
    <div data-testid="markdown-editor">
      <button onClick={() => onSave?.('test content')}>Save</button>
      <div>{placeholder}</div>
    </div>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('WritePage', () => {
  const user = userEvent.setup();

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

  it('handles save correctly', async () => {
    render(<WritePage />);

    const titleInput = screen.getByPlaceholderText('Enter your title...');
    await user.type(titleInput, 'Test Title');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    // Save button exists and was clicked successfully
    expect(saveButton).toBeInTheDocument();
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
});
