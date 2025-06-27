import { notFound } from 'next/navigation';
import UserProfilePage from '@/components/profile/UserProfilePage';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return {
    title: `${username} - Currents`,
    description: `Read ${username}'s current post on Currents`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Get the user's profile by username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
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
}
