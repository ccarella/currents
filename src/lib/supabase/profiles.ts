import { createClient } from './client';
import type { Database } from '@/types/database.generated';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export async function ensureUserProfile() {
  const supabase = createClient();
  const { data: user, error: userError } = await supabase.auth.getUser();

  if (userError || !user.user) {
    throw new Error('User not authenticated');
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.user.id)
    .single();

  // Profile exists, return success
  if (existingProfile) {
    return { success: true, profile: existingProfile };
  }

  // Profile doesn't exist, create it
  // Get user metadata for the profile
  const { email, user_metadata } = user.user;
  let username = user_metadata?.['username'] || email?.split('@')[0] || 'user';

  // Check if username already exists
  const { data: existingUsername } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  // Only append timestamp if username is taken
  if (existingUsername) {
    username = `${username}_${Date.now()}`;
  }

  const profileData: ProfileInsert = {
    id: user.user.id,
    username,
    email: email || '',
    full_name:
      user_metadata?.['full_name'] || user_metadata?.['name'] || username,
  };

  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (insertError) {
    // Handle race condition - profile might have been created by trigger
    if (insertError.code === '23505') {
      // Unique constraint violation - profile was created by another process
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.user.id)
        .single();

      return { success: true, profile };
    }
    throw insertError;
  }

  return { success: true, profile: newProfile };
}

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentUserProfile() {
  const supabase = createClient();
  const { data: user, error: userError } = await supabase.auth.getUser();

  if (userError || !user.user) {
    throw new Error('User not authenticated');
  }

  return getProfile(user.user.id);
}
