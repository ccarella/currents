-- Check and Fix Database Issues

-- 1. First, let's see what RLS policies exist on profiles
SELECT 'Current profile policies:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 2. Check what constraints exist on profiles
SELECT 'Current profile constraints:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c';

-- 3. Drop ALL policies and recreate only the correct ones
DROP POLICY IF EXISTS "Profiles can be read by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be read by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Create ONLY these 4 policies
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

-- 4. Add missing constraints if they don't exist
DO $$ 
BEGIN
    -- Check and add username_length constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'username_length' AND conrelid = 'public.profiles'::regclass) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30);
        RAISE NOTICE 'Added username_length constraint';
    END IF;
    
    -- Check and add bio_length constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bio_length' AND conrelid = 'public.profiles'::regclass) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 500);
        RAISE NOTICE 'Added bio_length constraint';
    END IF;
END $$;

-- 5. Verify the fixes
SELECT 'After fixes - Profile policies (should be 4):' as info;
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

SELECT 'After fixes - Profile constraints (should be at least 4):' as info;
SELECT COUNT(*) as constraint_count FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c';

SELECT 'Fixed policies:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

SELECT 'Fixed constraints:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;