import { notFound } from 'next/navigation';
import UserProfilePage from '@/components/profile/UserProfilePage';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  try {
    const { username } = await params;

    return {
      title: `${username} - Currents`,
      description: `Read ${username}'s current post on Currents`,
    };
  } catch (error) {
    console.error('Error in generateMetadata:', error);
    return {
      title: 'Currents',
      description: 'Read posts on Currents',
    };
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  try {
    const { username } = await params;

    // Validate username
    if (!username || typeof username !== 'string') {
      console.error('Invalid username parameter:', username);
      notFound();
    }

    const supabase = await createClient();

    // Get the user's profile by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', { username, error: profileError });
      notFound();
    }

    // Get the user's current published post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles!inner(
          id,
          username,
          full_name,
          avatar_url
        )
        `
      )
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    return (
      <UserProfilePage profile={profile} post={post} postError={postError} />
    );
  } catch (error) {
    console.error('Error in ProfilePage:', error);
    // Check if it's a Supabase initialization error
    if (
      error instanceof Error &&
      error.message.includes('Missing Supabase environment variables')
    ) {
      console.error(
        'Supabase configuration error - check environment variables'
      );
    }
    notFound();
  }
}
