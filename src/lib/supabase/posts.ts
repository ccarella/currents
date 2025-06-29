import { createClient } from './client';
import { ensureUserProfile } from './profiles';
import type { Database } from '@/types/database.generated';

type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostUpdate = Database['public']['Tables']['posts']['Update'];

export async function createPost(data: {
  title: string;
  content: string;
  slug?: string;
  status?: 'draft' | 'published' | 'archived';
}) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  // Ensure user has a profile before creating post
  try {
    await ensureUserProfile();
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw new Error('Failed to verify user profile. Please try again.');
  }

  // Validate input
  if (!data.title || data.title.trim().length === 0) {
    throw new Error('Title cannot be empty');
  }

  if (!data.content || data.content.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }

  if (data.title.length > 200) {
    throw new Error('Title must be 200 characters or less');
  }

  // Generate slug from title if not provided
  const slug = data.slug || generateSlug(data.title);

  // Generate excerpt from content
  const excerpt = generateExcerpt(data.content);

  const postData: PostInsert = {
    title: data.title,
    content: data.content,
    excerpt,
    slug,
    author_id: user.user.id,
    status: data.status || 'draft',
  };

  // Set published_at if status is published
  if (data.status === 'published') {
    postData.published_at = new Date().toISOString();
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single();

  if (error) {
    // Enhance error message for constraint violations
    if (
      error.code === '23514' &&
      error.message?.includes('published_date_consistency')
    ) {
      throw new Error(
        'Cannot publish post without a publication date. This should not happen - please report this issue.'
      );
    }
    throw error;
  }

  return post;
}

export async function updatePost(
  id: string,
  data: {
    title?: string;
    content?: string;
    status?: 'draft' | 'published' | 'archived';
  }
) {
  const supabase = createClient();
  const updateData: PostUpdate = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Update slug if title is provided
  if (data.title) {
    updateData.slug = generateSlug(data.title);
  }

  // Update excerpt if content is provided
  if (data.content) {
    updateData.excerpt = generateExcerpt(data.content);
  }

  // Handle published_at based on status changes
  if (data.status === 'published') {
    // Set published_at when publishing
    updateData.published_at = new Date().toISOString();
  } else if (data.status === 'draft' || data.status === 'archived') {
    // Clear published_at when unpublishing
    updateData.published_at = null;
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // Enhance error message for constraint violations
    if (
      error.code === '23514' &&
      error.message?.includes('published_date_consistency')
    ) {
      throw new Error(
        'Cannot publish post without a publication date. This should not happen - please report this issue.'
      );
    }
    throw error;
  }

  return post;
}

export async function getPostById(id: string) {
  const supabase = createClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return post;
}

export async function getUserDrafts() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.user.id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return posts;
}

export async function getUserCurrentPost() {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.user.id)
    .eq('status', 'published')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows found" which is expected if user has no published post
    throw error;
  }

  return post;
}

function generateSlug(title: string): string {
  // Generate base slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80); // Leave room for suffix

  // Add a timestamp suffix to ensure uniqueness
  const timestamp = Date.now().toString(36); // Base36 for shorter string
  const randomStr = Math.random().toString(36).substring(2, 6); // 4 random chars

  return `${baseSlug}-${timestamp}-${randomStr}`.substring(0, 100);
}

function generateExcerpt(content: string): string {
  // Strip HTML tags if any
  const plainText = content.replace(/<[^>]*>/g, '');

  // Truncate to 160 characters (leaving room for ellipsis)
  if (plainText.length <= 160) {
    return plainText;
  }

  // Find a good break point (end of word)
  let cutoff = 160;
  while (cutoff > 0 && plainText[cutoff] !== ' ') {
    cutoff--;
  }

  // If we couldn't find a space, just use the full 160
  if (cutoff === 0) {
    cutoff = 160;
  }

  return plainText.substring(0, cutoff).trim() + '...';
}
