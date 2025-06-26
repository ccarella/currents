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

  // Ensure user has a profile
  await ensureUserProfile();

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

  // Extract excerpt from content (first 160 characters)
  const excerpt =
    data.content.substring(0, 160).trim() +
    (data.content.length > 160 ? '...' : '');

  const postData: PostInsert = {
    title: data.title,
    content: data.content,
    slug,
    excerpt,
    author_id: user.user.id,
    status: data.status || 'draft',
  };

  const { data: post, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single();

  if (error) {
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

  // Update excerpt if content is provided
  if (data.content) {
    updateData.excerpt =
      data.content.substring(0, 160).trim() +
      (data.content.length > 160 ? '...' : '');
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
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
