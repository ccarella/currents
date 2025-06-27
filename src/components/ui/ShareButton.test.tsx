import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareButton from './ShareButton';

describe('ShareButton', () => {
  const mockUrl = 'https://example.com/test';
  const mockTitle = 'Test Title';
  const mockText = 'Test description';
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
    // Mock share API
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('renders share button with default state', () => {
    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button', { name: 'Share' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Share this post');
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('uses Web Share API when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<ShareButton url={mockUrl} title={mockTitle} text={mockText} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockShare).toHaveBeenCalledWith({
      title: mockTitle,
      text: mockText,
      url: mockUrl,
    });
  });

  it('falls back to clipboard when Web Share API is not available', async () => {
    const user = userEvent.setup();
    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockUrl);
    });
  });

  it('shows copied state after successful clipboard copy', async () => {
    const user = userEvent.setup();
    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    // Wait for the copied state to reset
    await waitFor(
      () => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles Web Share API cancellation gracefully', async () => {
    const mockShare = vi
      .fn()
      .mockRejectedValue(new DOMException('User cancelled', 'AbortError'));
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockShare).toHaveBeenCalled();
    expect(mockWriteText).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('falls back to clipboard on Web Share API error', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
      expect(mockWriteText).toHaveBeenCalledWith(mockUrl);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sharing:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles clipboard write failure', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard failed'));

    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(mockUrl);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to copy:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('uses default values when title and text are not provided', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<ShareButton url={mockUrl} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockShare).toHaveBeenCalledWith({
      title: 'Share',
      text: '',
      url: mockUrl,
    });
  });
});
