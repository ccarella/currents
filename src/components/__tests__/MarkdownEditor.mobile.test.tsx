import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkdownEditor from '../MarkdownEditor';

// Mock the MDEditor component
vi.mock('@uiw/react-md-editor', () => ({
  default: vi.fn(({ value, onChange, textareaProps }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={textareaProps?.placeholder}
      aria-label={textareaProps?.['aria-label']}
    />
  )),
}));

// Mock dynamic import
vi.mock('next/dynamic', () => ({
  default: (_fn: () => Promise<unknown>) => {
    const Component = vi.fn(({ value, onChange, textareaProps }) => (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={textareaProps?.placeholder}
        aria-label={textareaProps?.['aria-label']}
      />
    ));
    return Component;
  },
}));

// Mock PreviewPane
vi.mock('@/components/editor/PreviewPane', () => ({
  default: vi.fn(({ content }) => (
    <div data-testid="preview-pane">{content}</div>
  )),
}));

describe('MarkdownEditor Mobile Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window size
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Mobile Responsive Toolbar', () => {
    it('displays mobile-optimized toolbar on small screens', () => {
      global.innerWidth = 375; // iPhone size
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor />);

      // Check for mobile-specific classes
      const toolbar = screen.getByText('0 words').closest('div')
        ?.parentElement?.parentElement;
      expect(toolbar).toHaveClass(
        'flex',
        'flex-col',
        'sm:flex-row',
        'sm:items-center',
        'sm:justify-between',
        'p-3',
        'sm:p-4'
      );
    });

    it('shows abbreviated text on mobile buttons', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor onSave={vi.fn()} />);

      // The button should show both mobile and desktop text variants
      const postTexts = screen.getAllByText('Post');
      expect(postTexts).toHaveLength(2); // One for mobile, one for desktop

      // Check that mobile version is visible
      const mobileText = postTexts.find((el) =>
        el.classList.contains('sm:hidden')
      );
      expect(mobileText).toBeInTheDocument();

      expect(screen.queryByText('Posting...')).not.toBeInTheDocument();
    });

    it('hides focus mode button on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor />);

      // Focus mode button should be hidden on mobile
      const focusButton = screen.queryByLabelText(/focus mode/i);
      expect(focusButton).toHaveClass('hidden', 'sm:flex');
    });
  });

  describe('Swipe Gestures', () => {
    it('switches from edit to preview mode on left swipe', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor initialContent="Test content" />);

      const editor = screen.getByPlaceholderText(
        'Start writing your content here...'
      );
      const container = editor.closest('.flex-1');

      // Simulate left swipe
      if (container) {
        fireEvent.touchStart(container, { touches: [{ clientX: 200 }] });
        fireEvent.touchMove(container, { touches: [{ clientX: 100 }] });
        fireEvent.touchEnd(container);
      }

      await waitFor(() => {
        expect(screen.getByTestId('preview-pane')).toBeInTheDocument();
      });
    });

    it('switches from preview to edit mode on right swipe', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor initialContent="Test content" />);

      // First switch to preview mode
      const previewButton = screen.getByLabelText('Preview mode');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByTestId('preview-pane')).toBeInTheDocument();
      });

      const container = screen.getByTestId('preview-pane').closest('.flex-1');

      // Simulate right swipe
      if (container) {
        fireEvent.touchStart(container, { touches: [{ clientX: 100 }] });
        fireEvent.touchMove(container, { touches: [{ clientX: 200 }] });
        fireEvent.touchEnd(container);
      }

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Start writing your content here...')
        ).toBeInTheDocument();
      });
    });

    it('shows swipe indicator on mobile', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor />);

      await waitFor(() => {
        expect(screen.getByText('Swipe to preview')).toBeInTheDocument();
        expect(screen.getByText('Swipe to preview')).toHaveClass(
          'animate-pulse'
        );
      });
    });

    it('does not respond to swipes on desktop', async () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor initialContent="Test content" />);

      const editor = screen.getByPlaceholderText(
        'Start writing your content here...'
      );
      const container = editor.closest('.flex-1');

      // Simulate left swipe
      if (container) {
        fireEvent.touchStart(container, { touches: [{ clientX: 200 }] });
        fireEvent.touchMove(container, { touches: [{ clientX: 100 }] });
        fireEvent.touchEnd(container);
      }

      // Should still be in edit mode
      expect(
        screen.getByPlaceholderText('Start writing your content here...')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('preview-pane')).not.toBeInTheDocument();
    });
  });

  describe('Touch-friendly Buttons', () => {
    it('applies touch-target class to toolbar buttons', () => {
      render(<MarkdownEditor onSave={vi.fn()} />);

      const saveButton = screen.getByLabelText('Save document');
      expect(saveButton).toHaveClass('touch-target');

      const editButton = screen.getByLabelText('Edit mode');
      expect(editButton).toHaveClass('touch-target');

      const previewButton = screen.getByLabelText('Preview mode');
      expect(previewButton).toHaveClass('touch-target');
    });
  });

  describe('Responsive Text', () => {
    it('uses smaller text sizes on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<MarkdownEditor />);

      const wordCount = screen.getByText('0 words').parentElement;
      expect(wordCount).toHaveClass('text-xs', 'sm:text-sm');
    });
  });

  describe('Window Resize Handling', () => {
    it('updates mobile state on window resize', async () => {
      render(<MarkdownEditor />);

      // Start on desktop
      expect(screen.queryByText('Swipe to preview')).not.toBeInTheDocument();

      // Resize to mobile
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText('Swipe to preview')).toBeInTheDocument();
      });

      // Resize back to desktop
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(screen.queryByText('Swipe to preview')).not.toBeInTheDocument();
      });
    });
  });
});
