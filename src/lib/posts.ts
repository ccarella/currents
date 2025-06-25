import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type Post = Database['public']['Tables']['posts']['Row'];
export type NewPost = Database['public']['Tables']['posts']['Insert'];
export type UpdatePost = Database['public']['Tables']['posts']['Update'];

export class PostsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new post for a user (will replace any existing active post)
   */
  async createPost(data: NewPost) {
    const { data: post, error } = await this.supabase
      .from('posts')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return post;
  }

  /**
   * Get the active post for a user using the database function
   */
  async getActivePost(userId: string) {
    const { data: posts, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return posts?.[0] || null;
  }

  /**
   * Get all posts for a user (including archived ones)
   */
  async getUserPosts(userId: string) {
    const { data: posts, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts;
  }

  /**
   * Get all active posts (one per user)
   */
  async getActivePosts() {
    const { data: posts, error } = await this.supabase
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
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts;
  }

  /**
   * Get a post by slug
   */
  async getPostBySlug(slug: string) {
    const { data: post, error } = await this.supabase
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
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return post;
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, updates: UpdatePost) {
    const { data: post, error } = await this.supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return post;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string) {
    const { error } = await this.supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  /**
   * Generate a slug from text using the database function
   */
  async generateSlug(text: string) {
    // Generate slug locally instead of using database function
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Archive all posts for a user (set status to 'archived')
   */
  async archiveUserPosts(userId: string) {
    const { error } = await this.supabase
      .from('posts')
      .update({ status: 'archived' })
      .eq('author_id', userId)
      .neq('status', 'archived');

    if (error) throw error;
  }
}
