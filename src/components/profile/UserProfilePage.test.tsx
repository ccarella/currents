import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserProfilePage from './UserProfilePage';
import { Database } from '@/types/database.generated';
import { PostgrestError } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
};

// Mock the PostView component
vi.mock('@/components/post/PostView', () => ({
  default: ({ post }: { post: Post }) => (
    <div data-testid="post-view">{post.title}</div>
  ),
}));

describe('UserProfilePage', () => {
  const mockProfile: Profile = {
    id: '123',
    username: 'testuser',
    full_name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockPost: Post = {
    id: '456',
    title: 'Test Post',
    content: 'Test content',
    slug: 'test-post',
    excerpt: 'Test excerpt',
    author_id: '123',
    status: 'published',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    published_at: '2024-01-01',
    profiles: {
      id: '123',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
  };

  it('renders profile header with user information', () => {
    render(
      <UserProfilePage profile={mockProfile} post={mockPost} postError={null} />
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test User' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('renders profile without full name', () => {
    const profileWithoutFullName = { ...mockProfile, full_name: null };

    render(
      <UserProfilePage
        profile={profileWithoutFullName}
        post={mockPost}
        postError={null}
      />
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders post when available', () => {
    render(
      <UserProfilePage profile={mockProfile} post={mockPost} postError={null} />
    );

    expect(screen.getByTestId('post-view')).toBeInTheDocument();
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('shows no post message when user has no posts', () => {
    const noPostError = {
      code: 'PGRST116',
      message: 'No rows found',
    } as PostgrestError;

    render(
      <UserProfilePage
        profile={mockProfile}
        post={null}
        postError={noPostError}
      />
    );

    expect(
      screen.getByText("testuser hasn't posted anything yet.")
    ).toBeInTheDocument();
  });

  it('shows error message when post loading fails', () => {
    const error = {
      code: 'ERROR',
      message: 'Failed to load',
      details: '',
      hint: '',
    } as PostgrestError;

    render(
      <UserProfilePage profile={mockProfile} post={null} postError={error} />
    );

    expect(
      screen.getByText('Error loading post. Please try again later.')
    ).toBeInTheDocument();
  });

  it('renders without avatar when not provided', () => {
    const profileWithoutAvatar = { ...mockProfile, avatar_url: null };

    render(
      <UserProfilePage
        profile={profileWithoutAvatar}
        post={mockPost}
        postError={null}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders without bio when not provided', () => {
    const profileWithoutBio = { ...mockProfile, bio: null };

    render(
      <UserProfilePage
        profile={profileWithoutBio}
        post={mockPost}
        postError={null}
      />
    );

    expect(screen.queryByText('Test bio')).not.toBeInTheDocument();
  });
});
