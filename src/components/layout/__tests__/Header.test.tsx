import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Header from '../Header';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth');

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

describe('Header', () => {
  const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Navigation', () => {
    it('renders logo and navigation links', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText('Currents')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('shows sign in and sign up buttons when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(
        screen.getByRole('link', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /sign up/i })
      ).toBeInTheDocument();
    });

    it('shows user menu and create post button when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText('Create Post')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of email
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('shows loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('toggles mobile menu when hamburger button is clicked', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      const menuButton = screen.getByLabelText('Toggle mobile menu');

      // Mobile menu should be closed initially
      expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(menuButton);

      // Mobile navigation should be visible
      const mobileExploreLinks = screen.getAllByText('Explore');
      expect(mobileExploreLinks).toHaveLength(2); // Desktop and mobile
    });

    it('closes mobile menu when a link is clicked', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      const menuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(menuButton);

      const exploreLinks = screen.getAllByText('Explore');
      const mobileExploreLink = exploreLinks[1]; // Get the mobile version
      fireEvent.click(mobileExploreLink);

      // Mobile menu should close
      const exploreLinksAfterClick = screen.getAllByText('Explore');
      expect(exploreLinksAfterClick).toHaveLength(1); // Only desktop version
    });

    it('shows user email in mobile menu when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      const menuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(menuButton);

      expect(
        screen.getByText('Signed in as test@example.com')
      ).toBeInTheDocument();
    });
  });

  describe('User Menu Dropdown', () => {
    it('shows dropdown menu items on hover', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      const userButton = screen.getByLabelText('User menu');

      // Simulate hover
      const parentElement = userButton.parentElement;
      if (parentElement) {
        fireEvent.mouseEnter(parentElement);
      }

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      render(<Header />);

      const logo = screen.getByText('Currents');
      expect(logo.tagName).toBe('A'); // Logo should be a link
    });
  });
});
