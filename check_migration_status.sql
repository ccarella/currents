-- Check if migration was already applied
SELECT 'Checking users table:' as info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'users'
) as users_table_exists;

SELECT 'Checking profiles email column:' as info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'email'
) as email_column_exists;

SELECT 'Current RLS policies on profiles:' as info;
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
