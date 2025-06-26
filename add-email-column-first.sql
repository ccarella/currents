-- Add email column to profiles table first
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Make it unique after adding
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Now run the rest of the setup
SELECT 'Email column added successfully!' as status;

-- Check current state
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;