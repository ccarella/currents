-- Comprehensive Database Verification Script

-- 1. Check all tables exist
SELECT '=== TABLES CHECK ===' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check profiles table structure
SELECT '=== PROFILES TABLE STRUCTURE ===' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if users table is gone
SELECT '=== USERS TABLE CHECK (should be false) ===' as section;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'users'
) as users_table_exists;

-- 4. Check constraints on profiles
SELECT '=== PROFILES CONSTRAINTS ===' as section;
SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'c';

-- 5. Check constraints on posts
SELECT '=== POSTS CONSTRAINTS ===' as section;
SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.posts'::regclass
AND contype = 'c';

-- 6. Check RLS is enabled
SELECT '=== RLS STATUS ===' as section;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'posts', 'tags', 'post_tags');

-- 7. Check RLS policies on profiles
SELECT '=== PROFILES RLS POLICIES ===' as section;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 8. Check if handle_new_user function exists
SELECT '=== TRIGGER FUNCTION CHECK ===' as section;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user' 
AND pronamespace = 'public'::regnamespace;

-- 9. Check if trigger exists
SELECT '=== TRIGGER CHECK ===' as section;
SELECT tgname as trigger_name, tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 10. Check indexes
SELECT '=== INDEXES ===' as section;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'posts', 'tags', 'post_tags')
ORDER BY tablename, indexname;

-- 11. Summary
SELECT '=== SUMMARY ===' as section;
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as profile_policies_count,
  (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND contype = 'c') as profile_constraints_count,
  (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'public.posts'::regclass AND contype = 'c') as posts_constraints_count;