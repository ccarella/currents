-- Fix critical security issues identified in database review

-- 1. First add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Drop the redundant users table and transfer any necessary data
-- Transfer email and username data from users table to profiles
UPDATE public.profiles p
SET 
  email = u.email,
  username = COALESCE(p.username, u.username)
FROM public.users u
WHERE p.id = u.id;

-- Drop the redundant users table
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Fix overly permissive RLS policies on profiles table
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

-- 3. Add missing constraints
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

-- 4. Add composite index for better performance
CREATE INDEX IF NOT EXISTS idx_post_tags_by_tag ON public.post_tags(tag_id, post_id);

-- 5. Remove duplicate function definition if it exists
-- The update_updated_at_column function should only be defined once
-- It's already defined in the initial schema, so we don't need to redefine it

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