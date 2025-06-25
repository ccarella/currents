import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type Post = Database['public']['Tables']['posts']['Row'];
export type NewPost = Database['public']['Tables']['posts']['Insert'];
export type UpdatePost = Database['public']['Tables']['posts']['Update'];

export class PostsService {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

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
    const { data: post, error } = await this.supabase
      .rpc('get_active_post', { p_user_id: userId })
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return post;
  }

  /**
   * Get all posts for a user (including archived ones)
   */
  async getUserPosts(userId: string) {
    const { data: posts, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
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
        users!inner(
          id,
          email,
          name,
          avatar_url
        )
      `
      )
      .is('previous_post_archived_at', null)
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
        users!inner(
          id,
          email,
          name,
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
    const { data: slug, error } = await this.supabase
      .rpc('generate_slug', { input_text: text })
      .single();

    if (error) throw error;
    return slug;
  }

  /**
   * Archive all posts for a user (set previous_post_archived_at to now)
   */
  async archiveUserPosts(userId: string) {
    const { error } = await this.supabase
      .from('posts')
      .update({ previous_post_archived_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('previous_post_archived_at', null);

    if (error) throw error;
  }
}
