import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '../UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useUserProfile');
vi.mock('next/navigation');
vi.mock('@/components/auth', () => ({
  SignOutButton: () => <button>Sign Out</button>,
}));

const mockUser = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01',
};

const mockProfile = {
  id: '123',
  username: 'testuser',
  email: 'test@example.com',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as AppRouterInstance);
  });

  it('renders nothing when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: null,
      loading: false,
      error: null,
    });

    const { container } = render(<UserMenu />);
    expect(container.firstChild).toBeNull();
  });

  it('renders username when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('falls back to email when username is not available', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: null,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    expect(screen.getByText('@test')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    const button = screen.getByRole('button', { name: 'User menu' });

    expect(screen.queryByText('View Profile')).not.toBeInTheDocument();

    await userEvent.click(button);

    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(
      <div>
        <UserMenu />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const button = screen.getByRole('button', { name: 'User menu' });
    await userEvent.click(button);

    expect(screen.getByText('View Profile')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    await userEvent.click(outside);

    await waitFor(() => {
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when escape key is pressed', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    const button = screen.getByRole('button', { name: 'User menu' });

    await userEvent.click(button);
    expect(screen.getByText('View Profile')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
    });
  });

  it('navigates through menu items with arrow keys', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    const button = screen.getByRole('button', { name: 'User menu' });

    await userEvent.click(button);

    const viewProfile = screen.getByText('View Profile');
    const settings = screen.getByText('Settings');

    // First item should be focused by default when dropdown opens
    expect(viewProfile.className).toMatch(/bg-gray-100/);

    await userEvent.keyboard('{ArrowDown}');
    // Now settings should be focused
    expect(settings.className).toMatch(/bg-gray-100/);
    expect(viewProfile.className).not.toMatch(/bg-gray-100/);

    await userEvent.keyboard('{ArrowUp}');
    // Back to viewProfile
    expect(viewProfile.className).toMatch(/bg-gray-100/);
    expect(settings.className).not.toMatch(/bg-gray-100/);
  });

  it('uses correct profile URL when username is available', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    const button = screen.getByRole('button', { name: 'User menu' });

    fireEvent.click(button);

    const profileLink = screen.getByText('View Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/testuser');
  });

  it('uses fallback profile URL when username is not available', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: null,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    const button = screen.getByRole('button', { name: 'User menu' });

    fireEvent.click(button);

    const profileLink = screen.getByText('View Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('has correct aria attributes', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(useUserProfile).mockReturnValue({
      profile: mockProfile,
      loading: false,
      error: null,
    });

    render(<UserMenu />);
    const button = screen.getByRole('button', { name: 'User menu' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');

    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('aria-orientation', 'vertical');
    expect(menu).toHaveAttribute('aria-labelledby', 'user-menu-button');
  });
});
