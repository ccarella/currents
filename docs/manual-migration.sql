-- Manual Migration Script for Supabase Dashboard
-- Run this in the SQL Editor at: https://supabase.com/dashboard/project/rclazmgxkyfkkqxodrmn/sql/new

-- IMPORTANT: This will DROP the users table. Make sure you have backed up any important data!

-- Check current state before migration
SELECT 'Current tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Start migration
BEGIN;

-- 1. First add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Drop the redundant users table if it exists
-- Note: Since you mentioned there are no users yet, this should be safe
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. Fix overly permissive RLS policies on profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Profiles can be read by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be read by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create more secure policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow reading public profile information (username only) for authenticated users
CREATE POLICY "Authenticated users can read public profile info" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() != id
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (in case trigger fails)
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Add missing constraints
-- Add length constraints to prevent abuse
ALTER TABLE public.profiles 
  ADD CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30),
  ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 500);

ALTER TABLE public.posts 
  ADD CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
  ADD CONSTRAINT title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT content_not_empty CHECK (char_length(content) > 0),
  ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  ADD CONSTRAINT published_date_consistency CHECK (
    (status != 'published') OR (published_at IS NOT NULL)
  );

ALTER TABLE public.tags 
  ADD CONSTRAINT name_not_empty CHECK (char_length(name) > 0),
  ADD CONSTRAINT name_length CHECK (char_length(name) <= 50),
  ADD CONSTRAINT tag_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- 5. Add composite index for better performance
CREATE INDEX IF NOT EXISTS idx_post_tags_by_tag ON public.post_tags(tag_id, post_id);

-- 6. Update the handle_new_user function to be more robust
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

-- 7. Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Unique username, 3-30 characters';
COMMENT ON COLUMN public.profiles.bio IS 'User biography, max 500 characters';
COMMENT ON TABLE public.posts IS 'Blog posts or articles';
COMMENT ON COLUMN public.posts.status IS 'Publication status: draft or published';
COMMENT ON COLUMN public.posts.slug IS 'URL-safe slug for the post';

-- Record this migration
INSERT INTO supabase_migrations.schema_migrations (version) 
VALUES ('20250626000724')
ON CONFLICT DO NOTHING;

COMMIT;

-- Verify migration success
SELECT 'Migration complete! Verifying results:' as info;
SELECT 'Tables after migration:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;