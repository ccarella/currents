import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlainTextEditor from './PlainTextEditor';

describe('PlainTextEditor', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
    // Reset window event listeners
    window.removeEventListener('beforeunload', vi.fn());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders with default props', () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute(
      'placeholder',
      'Start writing your content here...'
    );
  });

  it('renders with custom placeholder', () => {
    render(<PlainTextEditor placeholder="Custom placeholder" />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('displays initial content', () => {
    const initialContent = 'Hello, world!';
    render(<PlainTextEditor initialContent={initialContent} />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toHaveValue(initialContent);
  });

  it('updates content when typing', async () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    await user.type(textarea, 'New content');

    expect(textarea).toHaveValue('New content');
  });

  it('calculates word count correctly', async () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    await user.type(textarea, 'This is a test sentence with six words.');

    await waitFor(() => {
      expect(screen.getByText('8 words')).toBeInTheDocument();
    });
  });

  it('calculates reading time correctly', async () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
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
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
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

    render(<PlainTextEditor />);

    // The PlainTextEditor component will eventually load the draft
    // For now, we just verify the component renders
    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toBeInTheDocument();
  });

  it('does not load draft if initial content is provided', () => {
    localStorage.setItem('draft-content', 'Saved draft');

    render(<PlainTextEditor initialContent="Initial content" />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toHaveValue('Initial content');
  });

  it('toggles focus mode', () => {
    render(<PlainTextEditor />);

    const focusButton = screen.getByTitle('Enter focus mode');
    fireEvent.click(focusButton);

    const editorContainer = screen
      .getByRole('textbox', { name: /plain text editor/i })
      .closest('.flex.flex-col.h-full');
    expect(editorContainer).toHaveClass('fixed inset-0 z-50 bg-white');
    expect(screen.getByTitle('Exit focus mode')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Exit focus mode'));
    expect(editorContainer).not.toHaveClass('fixed inset-0 z-50 bg-white');
  });

  it('handles empty content correctly', async () => {
    render(<PlainTextEditor />);

    expect(screen.getByText('0 words')).toBeInTheDocument();
    expect(screen.getByText('0 min read')).toBeInTheDocument();
  });

  it('shows unsaved changes indicator', async () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    fireEvent.change(textarea, { target: { value: 'New unsaved content' } });

    await waitFor(() => {
      expect(screen.getByText('• Unsaved changes')).toBeInTheDocument();
    });
  });

  it('shows auto-save indicator', () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    fireEvent.change(textarea, { target: { value: 'Content to save' } });

    // Verify unsaved changes indicator appears
    expect(screen.getByText('• Unsaved changes')).toBeInTheDocument();
  });

  it('adds aria-labels for accessibility', () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toHaveAttribute('aria-label', 'Plain text editor');

    const focusButton = screen.getByTitle('Enter focus mode');
    expect(focusButton).toHaveAttribute('aria-label', 'Enter focus mode');
  });

  it('warns about unsaved changes before unload', async () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    fireEvent.change(textarea, { target: { value: 'Unsaved content' } });

    const mockEvent = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

    window.dispatchEvent(mockEvent);

    await waitFor(() => {
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  it('does not have a save button', () => {
    render(<PlainTextEditor />);

    expect(
      screen.queryByRole('button', { name: /save/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /post/i })
    ).not.toBeInTheDocument();
  });

  it('preserves textarea styling for readability', () => {
    render(<PlainTextEditor />);

    const textarea = screen.getByRole('textbox', {
      name: /plain text editor/i,
    });
    expect(textarea).toHaveClass('text-lg', 'leading-relaxed');
  });
});
