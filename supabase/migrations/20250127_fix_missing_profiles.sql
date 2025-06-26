-- Migration: Fix missing profiles for existing users
-- This migration ensures all authenticated users have a corresponding profile

-- First, create profiles for any users that don't have one
INSERT INTO profiles (id, username, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'username',
        SPLIT_PART(au.email, '@', 1) || '_' || EXTRACT(EPOCH FROM NOW())::TEXT
    ) as username,
    COALESCE(au.email, '') as email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'username',
        SPLIT_PART(au.email, '@', 1)
    ) as full_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Check if profile already exists (in case of race condition)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, username, email, full_name)
        VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'username',
                SPLIT_PART(NEW.email, '@', 1) || '_' || EXTRACT(EPOCH FROM NOW())::TEXT
            ),
            COALESCE(NEW.email, ''),
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                NEW.raw_user_meta_data->>'username',
                SPLIT_PART(NEW.email, '@', 1)
            )
        );
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where profile was created by another process
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();