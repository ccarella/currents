-- Update RLS policies to match issue #11 requirements
-- This migration updates the existing RLS policies to ensure:
-- 1. Users can only update their own profile
-- 2. Users can only create/update/delete their own posts  
-- 3. Public read access for posts (published only)
-- 4. Authenticated read access for user profiles

-- Note: The database has two separate tables:
-- - profiles: linked to auth.users, referenced by posts.author_id
-- - users: a separate table also linked to auth.users
-- This migration only updates policies for the profiles and posts tables.

-- Drop existing policies for profiles table (if they exist)
DO $$ 
BEGIN
    -- Drop profiles policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        DROP POLICY "Public profiles are viewable by everyone" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        DROP POLICY "Users can update own profile" ON profiles;
    END IF;

    -- Drop posts policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Published posts are viewable by everyone') THEN
        DROP POLICY "Published posts are viewable by everyone" ON posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Authors can view own posts') THEN
        DROP POLICY "Authors can view own posts" ON posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Authors can insert own posts') THEN
        DROP POLICY "Authors can insert own posts" ON posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Authors can update own posts') THEN
        DROP POLICY "Authors can update own posts" ON posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Authors can delete own posts') THEN
        DROP POLICY "Authors can delete own posts" ON posts;
    END IF;
END $$;

-- Create new policies for profiles table
-- Policy: Authenticated users can read all profiles (per issue #11 requirement)
CREATE POLICY "Authenticated users can read all profiles" 
  ON profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update only own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create new policies for posts table
-- Policy: Public can read published posts only (maintaining original behavior for security)
CREATE POLICY "Public can read published posts" 
  ON posts 
  FOR SELECT 
  USING (status = 'published');

-- Policy: Authors can view all their own posts (including drafts)
CREATE POLICY "Authors can view own posts" 
  ON posts 
  FOR SELECT 
  USING (auth.uid() = author_id);

-- Policy: Users can create posts (only their own)
CREATE POLICY "Users can create own posts" 
  ON posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can update only their own posts
CREATE POLICY "Users can update only own posts" 
  ON posts 
  FOR UPDATE 
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can delete only their own posts
CREATE POLICY "Users can delete only own posts" 
  ON posts 
  FOR DELETE 
  USING (auth.uid() = author_id);

-- Add service role policies for both tables (if they don't already exist)
-- Check and create service role policy for profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Service role full access profiles') THEN
        CREATE POLICY "Service role full access profiles" 
          ON profiles 
          FOR ALL 
          USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Check and create service role policy for posts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Service role full access posts') THEN
        CREATE POLICY "Service role full access posts" 
          ON posts 
          FOR ALL 
          USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Note: The users table has its own separate RLS policies defined in its migration file.
-- This migration does not modify the users table policies.