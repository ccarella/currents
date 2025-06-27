import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareButton } from './ShareButton';

describe('ShareButton', () => {
  const mockPost = {
    id: 'test-id',
    title: 'Test Post Title',
    user: {
      username: 'testuser',
    },
  };

  let mockWriteText: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

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

    // Mock window.location
    delete (window as unknown as { location: Location }).location;
    window.location = {
      ...originalLocation,
      origin: 'https://example.com',
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('renders share button with default state', () => {
    render(<ShareButton post={mockPost} />);

    const button = screen.getByRole('button', { name: 'Share options' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('toggles dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    render(<ShareButton post={mockPost} />);

    const button = screen.getByRole('button', { name: 'Share options' });

    // Open menu
    await user.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Share on X (Twitter)')).toBeInTheDocument();
    expect(screen.getByText('Share on LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Copy link')).toBeInTheDocument();

    // Close menu
    await user.click(button);
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ShareButton post={mockPost} />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByRole('button', { name: 'Share options' });

    // Open menu
    await user.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('generates correct Twitter/X share link', async () => {
    const user = userEvent.setup();
    render(<ShareButton post={mockPost} />);

    await user.click(screen.getByRole('button', { name: 'Share options' }));

    const twitterLink = screen.getByText('Share on X (Twitter)').closest('a');
    expect(twitterLink).toHaveAttribute(
      'href',
      'https://twitter.com/intent/tweet?text=%22Test%20Post%20Title%22%20by%20%40testuser&url=https%3A%2F%2Fexample.com%2Ftestuser'
    );
    expect(twitterLink).toHaveAttribute('target', '_blank');
    expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('generates correct LinkedIn share link', async () => {
    const user = userEvent.setup();
    render(<ShareButton post={mockPost} />);

    await user.click(screen.getByRole('button', { name: 'Share options' }));

    const linkedinLink = screen.getByText('Share on LinkedIn').closest('a');
    expect(linkedinLink).toHaveAttribute(
      'href',
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Ftestuser'
    );
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles post without title', async () => {
    const user = userEvent.setup();
    const postWithoutTitle = {
      ...mockPost,
      title: null,
    };

    render(<ShareButton post={postWithoutTitle} />);

    await user.click(screen.getByRole('button', { name: 'Share options' }));

    const twitterLink = screen.getByText('Share on X (Twitter)').closest('a');
    expect(twitterLink).toHaveAttribute(
      'href',
      expect.stringContaining('Check%20out%20this%20post%20by%20%40testuser')
    );
  });

  it.skip('copies link to clipboard and shows success message', async () => {
    const user = userEvent.setup();
    render(<ShareButton post={mockPost} />);

    // Open the menu
    await user.click(screen.getByRole('button', { name: 'Share options' }));

    // Should show the Copy link button initially
    expect(screen.getByText('Copy link')).toBeInTheDocument();

    // Click the copy button
    const copyButton = screen.getByText('Copy link').closest('button');
    if (copyButton) {
      await user.click(copyButton);
    }

    // Check clipboard was called
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/testuser');

    // Check success state
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    // Wait for success message to disappear and menu to close
    await waitFor(
      () => {
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it.skip('handles clipboard copy failure gracefully', async () => {
    mockWriteText.mockRejectedValue(new Error('Clipboard failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<ShareButton post={mockPost} />);

    await user.click(screen.getByRole('button', { name: 'Share options' }));

    const copyButton = screen.getByText('Copy link').closest('button');
    if (copyButton) {
      await user.click(copyButton);
    }

    // Check clipboard was called
    expect(mockWriteText).toHaveBeenCalled();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to copy link:',
        expect.any(Error)
      );
    });

    // Should not show success message
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    // Menu should still be open after error
    expect(screen.queryByRole('menu')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('closes menu when clicking social media links', async () => {
    const user = userEvent.setup();
    render(<ShareButton post={mockPost} />);

    await user.click(screen.getByRole('button', { name: 'Share options' }));

    const twitterLink = screen.getByText('Share on X (Twitter)');
    await user.click(twitterLink);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('maintains menu state independently for multiple instances', async () => {
    const user = userEvent.setup();
    const post1 = { ...mockPost, id: 'post1' };
    const post2 = { ...mockPost, id: 'post2' };

    render(
      <div>
        <div data-testid="share1">
          <ShareButton post={post1} />
        </div>
        <div data-testid="share2">
          <ShareButton post={post2} />
        </div>
      </div>
    );

    const button1 = screen.getByTestId('share1').querySelector('button');
    const button2 = screen.getByTestId('share2').querySelector('button');

    // Open first menu
    if (button1) {
      await user.click(button1);
    }
    expect(screen.getAllByRole('menu')).toHaveLength(1);

    // Open second menu (first should close)
    if (button2) {
      await user.click(button2);
    }
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });
});
