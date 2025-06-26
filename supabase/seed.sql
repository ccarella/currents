-- Seed data for development and testing
-- Note: These are test accounts with known passwords for development only
-- NEVER use these in production!

-- Insert test users and let the trigger create profiles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'alice@example.com', '$2a$10$PDbmKqH5xUJ/hW3i8XR0s.0sFclno7ybafL3J9HeKDBtN1jA3EOHC', NOW(), '{"username": "alice_dev"}', NOW(), NOW()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'bob@example.com', '$2a$10$PDbmKqH5xUJ/hW3i8XR0s.0sFclno7ybafL3J9HeKDBtN1jA3EOHC', NOW(), '{"username": "bob_designer"}', NOW(), NOW()),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'charlie@example.com', '$2a$10$PDbmKqH5xUJ/hW3i8XR0s.0sFclno7ybafL3J9HeKDBtN1jA3EOHC', NOW(), '{"username": "charlie_writer"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update profiles with additional information (wrapped in DO block for single statement)
DO $$
BEGIN
  UPDATE profiles SET 
    full_name = 'Alice Developer',
    bio = 'Full-stack developer passionate about React and TypeScript',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
  WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  UPDATE profiles SET 
    full_name = 'Bob Designer',
    bio = 'UI/UX designer who loves creating beautiful interfaces',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
  WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

  UPDATE profiles SET 
    full_name = 'Charlie Writer',
    bio = 'Technical writer and content creator',
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'
  WHERE id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';

  -- Create tags
  INSERT INTO tags (id, name, slug) VALUES 
    ('10000000-0000-0000-0000-000000000001', 'JavaScript', 'javascript'),
    ('10000000-0000-0000-0000-000000000002', 'TypeScript', 'typescript'),
    ('10000000-0000-0000-0000-000000000003', 'React', 'react'),
    ('10000000-0000-0000-0000-000000000004', 'Next.js', 'nextjs'),
    ('10000000-0000-0000-0000-000000000005', 'Supabase', 'supabase'),
    ('10000000-0000-0000-0000-000000000006', 'Database', 'database'),
    ('10000000-0000-0000-0000-000000000007', 'Authentication', 'authentication'),
    ('10000000-0000-0000-0000-000000000008', 'CSS', 'css'),
    ('10000000-0000-0000-0000-000000000009', 'Tailwind', 'tailwind'),
    ('10000000-0000-0000-0000-000000000010', 'Testing', 'testing')
  ON CONFLICT (id) DO NOTHING;

  -- Create posts
  INSERT INTO posts (id, author_id, title, slug, content, excerpt, status, published_at) VALUES 
    ('20000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Getting Started with Next.js 15 and Supabase', 'getting-started-nextjs-15-supabase',
     E'# Getting Started with Next.js 15 and Supabase\n\nNext.js 15 brings exciting new features that work seamlessly with Supabase.',
     'Learn how to build modern web applications with Next.js 15 and Supabase.', 'published', NOW() - INTERVAL '2 days'),
    ('20000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Advanced TypeScript Patterns', 'advanced-typescript-patterns',
     'Working on this comprehensive guide...', 'Deep dive into advanced TypeScript patterns.', 'draft', NULL),
    ('20000000-0000-0000-0000-000000000003', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Modern CSS Architecture with Tailwind', 'modern-css-architecture-tailwind',
     E'# Modern CSS Architecture with Tailwind\n\nTailwind CSS has revolutionized styling.',
     'Explore modern CSS architecture patterns using Tailwind CSS.', 'published', NOW() - INTERVAL '5 days'),
    ('20000000-0000-0000-0000-000000000004', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Writing Effective Technical Documentation', 'writing-effective-technical-documentation',
     E'# Writing Effective Technical Documentation\n\nGood documentation is crucial.',
     'Learn the principles of writing clear technical documentation.', 'published', NOW() - INTERVAL '1 week')
  ON CONFLICT (id) DO NOTHING;

  -- Add tags to posts
  INSERT INTO post_tags (post_id, tag_id) VALUES 
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'), -- React
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'), -- Next.js
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005'), -- Supabase
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'), -- TypeScript
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008'), -- CSS
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009'), -- Tailwind
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000010')  -- Testing
  ON CONFLICT DO NOTHING;
END $$;