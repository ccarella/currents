import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/lib/AuthContext';
import WritePage from './page';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock the MarkdownEditor component
vi.mock('@/components/MarkdownEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="markdown-editor">Editor</div>,
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/write',
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

// Mock the useRequireAuth hook
vi.mock('@/hooks/useRequireAuth', () => ({
  useRequireAuth: () => ({
    user: { id: '123', email: 'test@example.com' },
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock Supabase posts functions
vi.mock('@/lib/supabase/posts', () => ({
  createPost: vi.fn().mockResolvedValue({ id: 'new-post-id' }),
  updatePost: vi.fn().mockResolvedValue({}),
  getPostById: vi.fn().mockResolvedValue({
    id: 'post-id',
    title: 'Test Post',
    content: 'Test content',
  }),
}));

describe('WritePage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders write page when authenticated', async () => {
    render(
      <AuthProvider>
        <WritePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Enter your title...')
      ).toBeInTheDocument();
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });
  });

  it('has full height layout', () => {
    const { container } = render(
      <AuthProvider>
        <WritePage />
      </AuthProvider>
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-screen');
  });
});
