-- Update RLS policies to match issue #11 requirements

-- Drop existing policies for profiles table (using profiles instead of users)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop existing policies for posts table
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON posts;
DROP POLICY IF EXISTS "Authors can insert own posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;

-- Create new policies for profiles table
-- Policy: Public can read all profiles (for discoverability)
CREATE POLICY "Public can read all profiles" 
  ON profiles 
  FOR SELECT 
  USING (true);

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update only own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create new policies for posts table
-- Policy: Public read access for all posts
CREATE POLICY "Public can read all posts" 
  ON posts 
  FOR SELECT 
  USING (true);

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

-- Add service role policies for both tables
-- Policy: Service role has full access to profiles table
CREATE POLICY "Service role full access profiles" 
  ON profiles 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Policy: Service role has full access to posts table
CREATE POLICY "Service role full access posts" 
  ON posts 
  FOR ALL 
  USING (auth.role() = 'service_role');