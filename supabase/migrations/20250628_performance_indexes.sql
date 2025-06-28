-- Add indexes for performance optimization

-- Index on posts table for common queries
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts(status, created_at DESC);

-- Composite index for the most common query pattern (active posts ordered by date)
CREATE INDEX IF NOT EXISTS idx_posts_active_recent ON posts(status, created_at DESC) 
WHERE status = 'published';

-- Index on profiles for faster joins
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Add GIN index for future full-text search capabilities
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_posts_title_gin ON posts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_gin ON posts USING gin(content gin_trgm_ops);

-- Analyze tables to update statistics
ANALYZE posts;
ANALYZE profiles;