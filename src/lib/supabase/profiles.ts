import { createClient } from './client';
import type { Database } from '@/types/database.generated';

type Profile = Database['public']['Tables']['profiles']['Row'];

export async function ensureUserProfile() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.user.id)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  // Create profile if it doesn't exist
  const username =
    user.user.user_metadata?.username ||
    user.user.email?.split('@')[0] + Math.floor(Math.random() * 10000);

  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.user.id,
      email: user.user.email || '',
      username: username,
    })
    .select()
    .single();

  if (error) {
    // Check if it's a unique constraint error
    if (error.code === '23505') {
      // Profile might have been created by another process
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (profile) {
        return profile;
      }
    }

    console.error('Failed to create profile:', error);
    throw new Error(
      'Failed to create user profile. Please try again or contact support.'
    );
  }

  return newProfile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
