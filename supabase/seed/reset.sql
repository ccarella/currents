-- Reset script for development
-- WARNING: This will DELETE ALL DATA. Only use in development!

-- Disable triggers temporarily to avoid issues
SET session_replication_role = 'replica';

-- Clear all data from tables in correct order (respecting foreign keys)
TRUNCATE TABLE public.post_tags CASCADE;
TRUNCATE TABLE public.tags CASCADE;
TRUNCATE TABLE public.posts CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Clear test users from auth.users (only the test user IDs we know about)
DELETE FROM auth.users 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences if any
-- (Currently no sequences in the schema, but this is where they would go)

DO $$
BEGIN
  RAISE NOTICE 'Database reset complete!';
  RAISE NOTICE 'All test data has been removed.';
  RAISE NOTICE 'Run the seed script to repopulate with test data.';
END $$;