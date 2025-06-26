-- Migration to create missing profiles for existing auth users
-- This fixes the foreign key constraint error when users try to create posts

-- Create profiles for any auth users that don't have one
INSERT INTO public.profiles (id, email, username, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    -- Generate username from email prefix with random suffix
    CONCAT(
        SPLIT_PART(au.email, '@', 1),
        '_',
        FLOOR(RANDOM() * 10000)::TEXT
    ) as username,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the trigger function exists and is working
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username TEXT;
BEGIN
    -- Extract username from metadata or generate from email
    new_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Ensure username meets constraints
    new_username := LOWER(SUBSTRING(new_username FROM 1 FOR 30));
    
    -- Remove any characters that don't match our pattern
    new_username := REGEXP_REPLACE(new_username, '[^a-z0-9_]', '', 'g');
    
    -- Ensure minimum length
    IF LENGTH(new_username) < 3 THEN
        new_username := new_username || 'user';
    END IF;
    
    -- Handle duplicates by appending random numbers
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
        new_username := SUBSTRING(new_username FROM 1 FOR 26) || FLOOR(RANDOM() * 10000)::TEXT;
    END LOOP;
    
    INSERT INTO public.profiles (id, email, username, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        new_username,
        NEW.created_at,
        NEW.created_at
    );
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If we still somehow get a unique violation, try with timestamp
        new_username := SUBSTRING(new_username FROM 1 FOR 20) || 
                       EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        
        INSERT INTO public.profiles (id, email, username, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            new_username,
            NEW.created_at,
            NEW.created_at
        );
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth transaction
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment explaining the purpose
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile for new auth users automatically';