-- Complete Database Setup Script
-- This creates all tables from scratch with security fixes applied

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for post status
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Create profiles table (without users table)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE,  -- Added email column
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Add constraints
    CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30),
    CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    status post_status DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Add constraints
    CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
    CONSTRAINT title_length CHECK (char_length(title) <= 200),
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0),
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT published_date_consistency CHECK (
        (status != 'published') OR (published_at IS NOT NULL)
    )
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Add constraints
    CONSTRAINT name_not_empty CHECK (char_length(name) > 0),
    CONSTRAINT name_length CHECK (char_length(name) <= 50),
    CONSTRAINT tag_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_by_tag ON post_tags(tag_id, post_id);

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  generated_username text;
BEGIN
  -- Generate username from email, ensuring uniqueness
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Ensure username is unique by appending a number if necessary
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = generated_username) LOOP
    generated_username := generated_username || '_' || floor(random() * 1000)::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    generated_username,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies for profiles
CREATE POLICY "Users can read own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read public profile info" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() != id
  );

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for posts
CREATE POLICY "Anyone can read published posts" ON posts
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors can see their own posts" ON posts
  FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can create posts" ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" ON posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts" ON posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for tags
CREATE POLICY "Anyone can read tags" ON tags
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tags" ON tags
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for post_tags
CREATE POLICY "Anyone can read post tags" ON post_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage their post tags" ON post_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Unique username, 3-30 characters';
COMMENT ON COLUMN public.profiles.bio IS 'User biography, max 500 characters';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON TABLE public.posts IS 'Blog posts or articles';
COMMENT ON COLUMN public.posts.status IS 'Publication status: draft or published';
COMMENT ON COLUMN public.posts.slug IS 'URL-safe slug for the post';

-- Create migration history table if it doesn't exist
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version TEXT PRIMARY KEY,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mark all migrations as applied
INSERT INTO supabase_migrations.schema_migrations (version) VALUES 
  ('20241224_initial_schema'),
  ('20250625004232_update_rls_policies'),
  ('20250626000724_fix_critical_security_issues')
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Database setup complete!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;