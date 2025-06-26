import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PreviewPane from '../PreviewPane';

// Mock Prism.js
vi.mock('prismjs', () => ({
  default: {
    highlightAll: vi.fn(),
  },
}));

// Mock Prism imports
vi.mock('prismjs/themes/prism-tomorrow.css', () => ({}));
vi.mock('prismjs/components/prism-javascript', () => ({}));
vi.mock('prismjs/components/prism-typescript', () => ({}));
vi.mock('prismjs/components/prism-jsx', () => ({}));
vi.mock('prismjs/components/prism-tsx', () => ({}));
vi.mock('prismjs/components/prism-css', () => ({}));
vi.mock('prismjs/components/prism-json', () => ({}));
vi.mock('prismjs/components/prism-markdown', () => ({}));
vi.mock('prismjs/components/prism-bash', () => ({}));
vi.mock('prismjs/components/prism-python', () => ({}));
vi.mock('prismjs/components/prism-sql', () => ({}));

describe('PreviewPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Markdown Rendering', () => {
    it('renders basic markdown content', () => {
      const content = '# Hello World\n\nThis is a paragraph.';
      render(<PreviewPane content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Hello World'
      );
      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
    });

    it('renders lists correctly', () => {
      const content = '- Item 1\n- Item 2\n\n1. First\n2. Second';
      render(<PreviewPane content={content} />);

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('First')).toBeInTheDocument();
    });

    it('renders blockquotes', () => {
      const content = '> This is a quote';
      render(<PreviewPane content={content} />);

      const blockquote = screen
        .getByText('This is a quote')
        .closest('blockquote');
      expect(blockquote).toBeInTheDocument();
    });

    it('renders links', () => {
      const content = '[Click me](https://example.com)';
      render(<PreviewPane content={content} />);

      const link = screen.getByRole('link', { name: 'Click me' });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('renders inline code', () => {
      const content = 'Use `npm install` to install';
      render(<PreviewPane content={content} />);

      const code = screen.getByText('npm install');
      expect(code.tagName).toBe('CODE');
      expect(code).toHaveClass('px-1', 'py-0.5', 'rounded');
    });
  });

  describe('Code Block Rendering', () => {
    it('renders code blocks with language highlighting', () => {
      const content = '```javascript\nconst hello = "world";\n```';
      render(<PreviewPane content={content} />);

      const codeBlock = screen.getByText('const hello = "world";');
      expect(codeBlock.closest('pre')).toHaveClass('language-javascript');
      expect(codeBlock).toHaveClass('language-javascript');
    });

    it('renders code blocks without language', () => {
      const content = '```\nplain text code\n```';
      render(<PreviewPane content={content} />);

      const codeBlock = screen.getByText('plain text code');
      expect(codeBlock.closest('pre')).toBeInTheDocument();
    });

    it('calls Prism.highlightAll when content changes', async () => {
      const Prism = await import('prismjs');
      const { rerender } = render(<PreviewPane content="# Initial" />);

      expect(Prism.default.highlightAll).toHaveBeenCalledTimes(1);

      rerender(<PreviewPane content="# Updated" />);

      await waitFor(() => {
        expect(Prism.default.highlightAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('GFM Features', () => {
    it('renders tables', () => {
      const content =
        '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
      render(<PreviewPane content={content} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });

    it('renders strikethrough text', () => {
      const content = '~~strikethrough~~';
      render(<PreviewPane content={content} />);

      const del = screen.getByText('strikethrough');
      expect(del.tagName).toBe('DEL');
    });

    it('renders task lists', () => {
      const content = '- [x] Completed task\n- [ ] Incomplete task';
      render(<PreviewPane content={content} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe('Scroll Synchronization', () => {
    it('calls onScroll callback when scrolling', () => {
      const onScroll = vi.fn();
      const longContent = '# Long\n\n' + 'Content\n\n'.repeat(50);
      const { container } = render(
        <PreviewPane content={longContent} onScroll={onScroll} />
      );

      const scrollContainer = container.firstChild as HTMLElement;

      // Mock scroll dimensions
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 250,
        configurable: true,
      });

      fireEvent.scroll(scrollContainer);

      expect(onScroll).toHaveBeenCalledWith(0.5); // 250 / (1000 - 500) = 0.5
    });

    it('scrolls to percentage when scrollToPercentage prop changes', () => {
      const longContent = '# Long\n\n' + 'Content\n\n'.repeat(50);
      const { container, rerender } = render(
        <PreviewPane content={longContent} />
      );

      const scrollContainer = container.firstChild as HTMLElement;

      // Mock scroll dimensions
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 500,
        configurable: true,
      });

      // Mock scrollTop setter
      let mockScrollTop = 0;
      Object.defineProperty(scrollContainer, 'scrollTop', {
        get: () => mockScrollTop,
        set: (value: number) => {
          mockScrollTop = value;
        },
        configurable: true,
      });

      rerender(<PreviewPane content={longContent} scrollToPercentage={0.6} />);

      expect(mockScrollTop).toBe(300); // (1000 - 500) * 0.6 = 300
    });
  });

  describe('Styling', () => {
    it('applies prose classes for typography', () => {
      render(<PreviewPane content="# Test" />);

      const proseContainer = screen
        .getByRole('heading', { level: 1 })
        .closest('.prose');
      expect(proseContainer).toHaveClass(
        'prose',
        'prose-slate',
        'dark:prose-invert',
        'max-w-none'
      );
    });

    it('applies dark mode classes', () => {
      const { container } = render(<PreviewPane content="# Test" />);

      const scrollContainer = container.firstChild;
      expect(scrollContainer).toHaveClass('bg-white', 'dark:bg-gray-900');
    });

    it('renders images with proper styling', () => {
      const content = '![Alt text](https://example.com/image.jpg)';
      render(<PreviewPane content={content} />);

      const img = screen.getByRole('img', { name: 'Alt text' });
      expect(img).toHaveClass(
        'max-w-full',
        'h-auto',
        'rounded-lg',
        'shadow-md'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<PreviewPane content="" />);

      const proseContainer = screen.getByText('', { selector: '.prose' });
      expect(proseContainer).toBeInTheDocument();
    });

    it('handles very long content without errors', () => {
      const longContent = '# Title\n\n' + 'Lorem ipsum '.repeat(1000);

      expect(() => {
        render(<PreviewPane content={longContent} />);
      }).not.toThrow();
    });

    it('handles special characters in code blocks', () => {
      const content = '```\n<script>alert("XSS")</script>\n```';
      render(<PreviewPane content={content} />);

      const codeBlock = screen.getByText('<script>alert("XSS")</script>');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock.innerHTML).not.toContain('<script>');
    });
  });
});
