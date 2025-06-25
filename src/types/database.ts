export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          slug: string;
          created_at: string;
          previous_post_archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          slug?: string;
          created_at?: string;
          previous_post_archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          slug?: string;
          created_at?: string;
          previous_post_archived_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_active_post: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          slug: string;
          created_at: string;
        };
      };
      generate_slug: {
        Args: {
          input_text: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> =
  T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = { error: Error };

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface FilterOptions<T = unknown> {
  eq?: Partial<T>;
  neq?: Partial<T>;
  gt?: Partial<T>;
  gte?: Partial<T>;
  lt?: Partial<T>;
  lte?: Partial<T>;
  like?: Partial<Record<keyof T, string>>;
  ilike?: Partial<Record<keyof T, string>>;
  in?: Partial<Record<keyof T, unknown[]>>;
}
