-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  -- Remove consecutive hyphens and trim hyphens from start/end
  RETURN LOWER(
    TRIM(
      BOTH '-' FROM 
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          input_text,
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '[\s-]+', '-', 'g'  -- Replace spaces and hyphens with single hyphen
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create posts table with ephemeral nature (one active post per user)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_post_archived_at TIMESTAMPTZ,
  
  -- Foreign key to users table with cascade delete
  CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Ensure slug is unique across all posts
  CONSTRAINT posts_slug_unique UNIQUE (slug),
  
  -- Ensure only one active post per user
  CONSTRAINT posts_one_active_per_user 
    UNIQUE (user_id, previous_post_archived_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts (slug);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);

-- Create partial index for active posts (where previous_post_archived_at IS NULL)
CREATE INDEX IF NOT EXISTS posts_active_user_idx 
  ON public.posts (user_id) 
  WHERE previous_post_archived_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create function to handle post replacement logic
CREATE OR REPLACE FUNCTION public.handle_post_replacement()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive any existing active post for this user
  UPDATE public.posts 
  SET previous_post_archived_at = now()
  WHERE user_id = NEW.user_id 
    AND previous_post_archived_at IS NULL
    AND id != NEW.id;
  
  -- Ensure new post has NULL archived timestamp (making it active)
  NEW.previous_post_archived_at = NULL;
  
  -- Generate slug from title if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
    
    -- Ensure slug uniqueness by appending timestamp if needed
    WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug = NEW.slug || '-' || EXTRACT(EPOCH FROM now())::INTEGER;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle post replacement before insert
CREATE TRIGGER handle_post_replacement_trigger
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_replacement();

-- Create trigger to ensure slug generation on update
CREATE TRIGGER ensure_slug_on_update
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  WHEN (NEW.title != OLD.title AND (NEW.slug = OLD.slug OR NEW.slug IS NULL))
  EXECUTE FUNCTION public.handle_post_replacement();

-- RLS Policies

-- Policy: Users can view their own posts (active and archived)
CREATE POLICY "Users can view own posts" 
  ON public.posts 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can view all active posts
CREATE POLICY "Authenticated users can view active posts" 
  ON public.posts 
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' 
    AND previous_post_archived_at IS NULL
  );

-- Policy: Users can create posts (replacement handled by trigger)
CREATE POLICY "Users can create posts" 
  ON public.posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts" 
  ON public.posts 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts" 
  ON public.posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access" 
  ON public.posts 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
GRANT SELECT ON public.posts TO anon;

-- Create helper function to get active post for user
CREATE OR REPLACE FUNCTION public.get_active_post(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.slug,
    p.created_at
  FROM public.posts p
  WHERE p.user_id = p_user_id
    AND p.previous_post_archived_at IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION public.get_active_post(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_post(UUID) TO anon;