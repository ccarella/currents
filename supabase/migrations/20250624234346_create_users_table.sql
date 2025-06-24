-- Create users table with proper schema
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique constraints
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users (username);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create foreign key relationship with auth.users
ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Create RLS policies
-- Policy: Users can view their own record
CREATE POLICY "Users can view own record" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can manage all records
CREATE POLICY "Service role can manage all records" 
  ON public.users 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can check if username/email exists (for validation)
CREATE POLICY "Authenticated users can check existence" 
  ON public.users 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create function to handle user creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Default username to email prefix if not provided in metadata
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO anon;