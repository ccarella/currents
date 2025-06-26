import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

// Mock dynamic import for MDEditor
interface MockEditorProps {
  value: string;
  onChange: (value: string) => void;
  preview?: string;
  textareaProps?: { placeholder?: string };
}

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const MockMDEditor = ({
      value,
      onChange,
      preview,
      textareaProps,
    }: MockEditorProps) => (
      <div data-testid="md-editor">
        <textarea
          data-testid="md-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={textareaProps?.placeholder}
        />
        {preview === 'live' && <div data-testid="md-preview">{value}</div>}
      </div>
    );
    return MockMDEditor;
  },
}));

describe('MarkdownEditor', () => {
  const mockOnSave = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders with default props', () => {
    render(<MarkdownEditor />);

    expect(screen.getByTestId('md-editor')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Start writing your content here...')
    ).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<MarkdownEditor placeholder="Custom placeholder" />);

    expect(
      screen.getByPlaceholderText('Custom placeholder')
    ).toBeInTheDocument();
  });

  it('displays initial content', () => {
    const initialContent = 'Hello, world!';
    render(<MarkdownEditor initialContent={initialContent} />);

    const textarea = screen.getByTestId('md-textarea');
    expect(textarea).toHaveValue(initialContent);
  });

  it('updates content when typing', async () => {
    render(<MarkdownEditor />);

    const textarea = screen.getByTestId('md-textarea');
    await user.type(textarea, 'New content');

    expect(textarea).toHaveValue('New content');
  });

  it('calculates word count correctly', async () => {
    render(<MarkdownEditor />);

    const textarea = screen.getByTestId('md-textarea');
    await user.type(textarea, 'This is a test sentence with six words.');

    await waitFor(() => {
      expect(screen.getByText('8 words')).toBeInTheDocument();
    });
  });

  it('calculates reading time correctly', async () => {
    render(<MarkdownEditor />);

    const textarea = screen.getByTestId('md-textarea');
    // Type 250 words (should be ~2 minutes at 200 wpm)
    const longText = Array(250).fill('word').join(' ');

    // Use fireEvent for faster input
    fireEvent.change(textarea, { target: { value: longText } });

    await waitFor(() => {
      expect(screen.getByText('2 min read')).toBeInTheDocument();
    });
  });

  it('auto-saves to localStorage after typing', async () => {
    vi.useFakeTimers();
    render(<MarkdownEditor />);

    const textarea = screen.getByTestId('md-textarea');
    fireEvent.change(textarea, { target: { value: 'Auto-save test' } });

    // Fast-forward time by 1 second to trigger auto-save
    await vi.advanceTimersByTimeAsync(1100);

    expect(localStorage.getItem('draft-content')).toBe('Auto-save test');
    expect(localStorage.getItem('draft-timestamp')).toBeTruthy();
  });

  it('loads draft from localStorage on mount', () => {
    const savedContent = 'Saved draft content';
    const savedTimestamp = new Date().toISOString();
    localStorage.setItem('draft-content', savedContent);
    localStorage.setItem('draft-timestamp', savedTimestamp);

    render(<MarkdownEditor />);

    const textarea = screen.getByTestId('md-textarea');
    expect(textarea).toHaveValue(savedContent);
  });

  it('does not load draft if initial content is provided', () => {
    localStorage.setItem('draft-content', 'Saved draft');

    render(<MarkdownEditor initialContent="Initial content" />);

    const textarea = screen.getByTestId('md-textarea');
    expect(textarea).toHaveValue('Initial content');
  });

  it('calls onSave when save button is clicked', () => {
    render(<MarkdownEditor onSave={mockOnSave} />);

    const textarea = screen.getByTestId('md-textarea');
    fireEvent.change(textarea, { target: { value: 'Content to save' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('Content to save');
  });

  it('shows saving state when save is in progress', async () => {
    let resolvePromise: (() => void) | undefined;
    const slowSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );
    render(<MarkdownEditor onSave={slowSave} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Resolve the promise
    resolvePromise();

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('toggles focus mode', () => {
    render(<MarkdownEditor />);

    const focusButton = screen.getByTitle('Enter focus mode');
    fireEvent.click(focusButton);

    expect(
      screen.getByTestId('md-editor').parentElement?.parentElement
    ).toHaveClass('fixed inset-0 z-50 bg-white');
    expect(screen.getByTitle('Exit focus mode')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Exit focus mode'));
    expect(
      screen.getByTestId('md-editor').parentElement?.parentElement
    ).not.toHaveClass('fixed inset-0 z-50 bg-white');
  });

  it('displays last saved time correctly', async () => {
    // Mock a successful save that sets lastSaved
    const mockSaveWithTime = vi.fn().mockResolvedValue(undefined);
    render(<MarkdownEditor onSave={mockSaveWithTime} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saved just now')).toBeInTheDocument();
    });
  });

  it('does not show save button when onSave is not provided', () => {
    render(<MarkdownEditor />);

    expect(
      screen.queryByRole('button', { name: /save/i })
    ).not.toBeInTheDocument();
  });

  it('handles empty content correctly', async () => {
    render(<MarkdownEditor />);

    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('0 min read')).toBeInTheDocument();
  });
});
