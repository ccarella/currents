-- Create a view that shows only the most recent published post per user
CREATE OR REPLACE VIEW latest_posts_per_user AS
WITH ranked_posts AS (
  SELECT 
    p.*,
    ROW_NUMBER() OVER (PARTITION BY p.author_id ORDER BY p.created_at DESC) as rn
  FROM posts p
  WHERE p.status = 'published'
)
SELECT 
  rp.id,
  rp.author_id,
  rp.title,
  rp.slug,
  rp.content,
  rp.excerpt,
  rp.status,
  rp.published_at,
  rp.created_at,
  rp.updated_at
FROM ranked_posts rp
WHERE rp.rn = 1;

-- Create an index on the posts table to optimize the view query
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC) WHERE status = 'published';

-- Grant permissions on the view
GRANT SELECT ON latest_posts_per_user TO anon;
GRANT SELECT ON latest_posts_per_user TO authenticated;

-- Add a comment to document the view
COMMENT ON VIEW latest_posts_per_user IS 'Shows only the most recent published post for each user, used for the home feed';