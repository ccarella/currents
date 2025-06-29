import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Header from '../Header';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({ profile: null, loading: false })),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/auth', () => ({
  SignOutButton: () => <button>Sign Out</button>,
}));

vi.mock('@/components/layout', () => ({
  UserMenu: () => <div>User Menu</div>,
}));

describe('Header Mobile Menu', () => {
  beforeEach(() => {
    // Reset viewport to mobile size
    global.innerWidth = 375;
    global.innerHeight = 667;
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should show hamburger menu button on mobile', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('should open mobile menu when hamburger is clicked', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Menu should not be visible initially
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    // Click hamburger
    fireEvent.click(menuButton);

    // Menu items should be visible
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should close mobile menu when X is clicked', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Click X to close
    fireEvent.click(menuButton);

    // Menu should be hidden
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('should close mobile menu when a link is clicked', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Open menu
    fireEvent.click(menuButton);

    // Click a navigation link
    const aboutLink = screen.getByText('About');
    fireEvent.click(aboutLink);

    // Menu should be hidden
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('should lock body scroll when menu is open', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Body should not have overflow hidden initially
    expect(document.body.style.overflow).toBe('');

    // Open menu
    fireEvent.click(menuButton);

    // Body should have overflow hidden
    expect(document.body.style.overflow).toBe('hidden');

    // Close menu
    fireEvent.click(menuButton);

    // Body overflow should be restored
    expect(document.body.style.overflow).toBe('');
  });

  it('should show correct menu items for authenticated users', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    const { useUserProfile } = await import('@/hooks/useUserProfile');

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { email: 'test@example.com', id: '123' },
      loading: false,
    });

    (useUserProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      profile: { username: 'testuser' },
      loading: false,
    });

    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Open menu
    fireEvent.click(menuButton);

    // Should show authenticated menu items
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(
      screen.getByText('Signed in as test@example.com')
    ).toBeInTheDocument();
  });

  it('should show correct menu items for unauthenticated users', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Open menu
    fireEvent.click(menuButton);

    // Should show unauthenticated menu items
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should have correct aria attributes', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Initial state
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // Open menu
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    // Close menu
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should be accessible with proper z-index layering', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle mobile menu');

    // Open menu
    fireEvent.click(menuButton);

    const navigation = screen.getByRole('navigation');
    const navParent = navigation.parentElement;

    // Check that the mobile menu container exists and has proper classes
    expect(navParent).toHaveClass('md:hidden');
    expect(navParent).toHaveClass('fixed');
    expect(navParent).toHaveClass('z-50');
  });
});
