-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for post status
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    status post_status DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for posts
CREATE POLICY "Published posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view own posts" ON posts
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for tags
CREATE POLICY "Tags are viewable by everyone" ON tags
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for post_tags
CREATE POLICY "Post tags are viewable by everyone" ON post_tags
    FOR SELECT USING (true);

CREATE POLICY "Authors can manage tags for their posts" ON post_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM posts 
            WHERE posts.id = post_tags.post_id 
            AND posts.author_id = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();