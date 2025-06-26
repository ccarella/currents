-- Fixed Migration Script for Supabase Dashboard
-- This version handles existing policies gracefully

-- Check current state
SELECT 'Current tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check existing policies
SELECT 'Current RLS policies on profiles:' as info;
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Start migration
BEGIN;

-- 1. Add email column to profiles table (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Drop the users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. Drop ALL existing policies on profiles first
DROP POLICY IF EXISTS "Profiles can be read by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be read by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 4. Create new secure policies
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

-- 5. Add constraints (with IF NOT EXISTS handling)
DO $$ 
BEGIN
  -- Profiles constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'username_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 500);
  END IF;

  -- Posts constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'title_not_empty') THEN
    ALTER TABLE public.posts ADD CONSTRAINT title_not_empty CHECK (char_length(title) > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'title_length') THEN
    ALTER TABLE public.posts ADD CONSTRAINT title_length CHECK (char_length(title) <= 200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_not_empty') THEN
    ALTER TABLE public.posts ADD CONSTRAINT content_not_empty CHECK (char_length(content) > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'slug_format') THEN
    ALTER TABLE public.posts ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'published_date_consistency') THEN
    ALTER TABLE public.posts ADD CONSTRAINT published_date_consistency CHECK (
      (status != 'published') OR (published_at IS NOT NULL)
    );
  END IF;

  -- Tags constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'name_not_empty') THEN
    ALTER TABLE public.tags ADD CONSTRAINT name_not_empty CHECK (char_length(name) > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'name_length') THEN
    ALTER TABLE public.tags ADD CONSTRAINT name_length CHECK (char_length(name) <= 50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tag_slug_format') THEN
    ALTER TABLE public.tags ADD CONSTRAINT tag_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END $$;

-- 6. Add index if not exists
CREATE INDEX IF NOT EXISTS idx_post_tags_by_tag ON public.post_tags(tag_id, post_id);

-- 7. Update handle_new_user function
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

-- 8. Add comments
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Unique username, 3-30 characters';
COMMENT ON COLUMN public.profiles.bio IS 'User biography, max 500 characters';
COMMENT ON TABLE public.posts IS 'Blog posts or articles';
COMMENT ON COLUMN public.posts.status IS 'Publication status: draft or published';
COMMENT ON COLUMN public.posts.slug IS 'URL-safe slug for the post';

COMMIT;

-- Verify results
SELECT 'Migration complete! Final state:' as info;

SELECT 'Tables after migration:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT 'Profiles columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'RLS policies on profiles:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';