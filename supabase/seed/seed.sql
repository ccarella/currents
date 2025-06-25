-- Seed data for development
-- This file contains test data for local development

-- Create test users in auth.users (if not exists)
-- Note: In production, users are created through the auth flow
-- These are for local development only

-- First, ensure we have some test users in auth.users
-- Password for all test users: Test123!@#
DO $$
DECLARE
  user1_id uuid := '11111111-1111-1111-1111-111111111111';
  user2_id uuid := '22222222-2222-2222-2222-222222222222';
  user3_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert test users into auth.users if they don't exist
  -- Note: This requires service_role key access
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES 
    (user1_id, 'alice@example.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (user2_id, 'bob@example.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (user3_id, 'charlie@example.com', crypt('Test123!@#', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Clear existing seed data (for idempotency)
TRUNCATE TABLE public.post_tags CASCADE;
TRUNCATE TABLE public.tags CASCADE;
TRUNCATE TABLE public.posts CASCADE;
-- Don't truncate profiles or users as they might have been created by triggers

-- Insert profiles (if not exists due to triggers)
INSERT INTO public.profiles (id, username, full_name, bio, avatar_url)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'alice_dev', 'Alice Developer', 'Full-stack developer passionate about React and TypeScript', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'),
  ('22222222-2222-2222-2222-222222222222', 'bob_designer', 'Bob Designer', 'UI/UX designer with a love for minimalist design', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'),
  ('33333333-3333-3333-3333-333333333333', 'charlie_writer', 'Charlie Writer', 'Technical writer and content creator', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

-- Insert users (if not exists due to triggers)
INSERT INTO public.users (id, email, username)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'alice_dev'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com', 'bob_designer'),
  ('33333333-3333-3333-3333-333333333333', 'charlie@example.com', 'charlie_writer')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username;

-- Insert tags
INSERT INTO public.tags (name, slug)
VALUES 
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('Next.js', 'nextjs'),
  ('Supabase', 'supabase'),
  ('Web Development', 'web-development'),
  ('Design', 'design'),
  ('Tutorial', 'tutorial'),
  ('Best Practices', 'best-practices'),
  ('Database', 'database')
ON CONFLICT (slug) DO NOTHING;

-- Insert posts
INSERT INTO public.posts (author_id, title, slug, content, excerpt, status, published_at)
VALUES 
  -- Published posts by Alice
  (
    '11111111-1111-1111-1111-111111111111',
    'Getting Started with Next.js 15 and Supabase',
    'getting-started-nextjs-15-supabase',
    E'# Getting Started with Next.js 15 and Supabase\n\nIn this comprehensive guide, we\'ll explore how to build a full-stack application using Next.js 15 and Supabase.\n\n## Why Next.js 15?\n\nNext.js 15 brings several exciting features:\n- Turbopack for faster builds\n- Improved App Router\n- Better TypeScript support\n\n## Setting up Supabase\n\nFirst, install the Supabase client:\n\n```bash\nnpm install @supabase/supabase-js\n```\n\n## Creating Your First Table\n\nLet\'s create a simple posts table:\n\n```sql\nCREATE TABLE posts (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  title TEXT NOT NULL,\n  content TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n```\n\n## Conclusion\n\nWith Next.js 15 and Supabase, you have a powerful stack for building modern web applications.',
    'Learn how to build a full-stack application with Next.js 15 and Supabase, featuring authentication, real-time updates, and type-safe database queries.',
    'published',
    NOW() - INTERVAL '7 days'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'TypeScript Best Practices for React Applications',
    'typescript-best-practices-react',
    E'# TypeScript Best Practices for React Applications\n\nTypeScript has become the de facto standard for React applications. Here are some best practices to follow.\n\n## 1. Use Proper Type Definitions\n\nAlways define types for your props:\n\n```typescript\ninterface ButtonProps {\n  label: string;\n  onClick: () => void;\n  variant?: "primary" | "secondary";\n}\n```\n\n## 2. Avoid Using `any`\n\nThe `any` type defeats the purpose of TypeScript. Use `unknown` when you\'re unsure:\n\n```typescript\n// Bad\nconst processData = (data: any) => { /*...*/ }\n\n// Good\nconst processData = (data: unknown) => {\n  if (typeof data === "object" && data !== null) {\n    // Process data\n  }\n}\n```\n\n## 3. Use Type Guards\n\nType guards help narrow down types:\n\n```typescript\nfunction isUser(obj: unknown): obj is User {\n  return (\n    typeof obj === "object" &&\n    obj !== null &&\n    "id" in obj &&\n    "email" in obj\n  );\n}\n```',
    'Discover essential TypeScript best practices for building robust and maintainable React applications.',
    'published',
    NOW() - INTERVAL '14 days'
  ),
  
  -- Draft posts by Bob
  (
    '22222222-2222-2222-2222-222222222222',
    'Modern CSS Techniques for 2024',
    'modern-css-techniques-2024',
    E'# Modern CSS Techniques for 2024\n\n## CSS Grid and Subgrid\n\nCSS Grid has revolutionized layout design...\n\n## Container Queries\n\nContainer queries allow components to be truly responsive...\n\n(This is still a work in progress)',
    'Explore the latest CSS techniques and features available in 2024.',
    'draft',
    NULL
  ),
  
  -- Published posts by Charlie
  (
    '33333333-3333-3333-3333-333333333333',
    'Writing Technical Documentation That Developers Love',
    'technical-documentation-developers-love',
    E'# Writing Technical Documentation That Developers Love\n\nGood documentation is crucial for any software project. Here\'s how to write docs that developers will actually want to read.\n\n## 1. Start with Why\n\nBefore diving into the "how," explain the "why." Developers need context:\n\n- What problem does this solve?\n- When should I use this?\n- What are the alternatives?\n\n## 2. Show, Don\'t Just Tell\n\nAlways include examples:\n\n```javascript\n// Instead of: "The function accepts a configuration object"\n// Show this:\nconst result = processData({\n  format: "json",\n  validate: true,\n  maxSize: 1000\n});\n```\n\n## 3. Keep It Up to Date\n\nOutdated documentation is worse than no documentation. Set up processes to keep docs in sync with code.\n\n## 4. Structure for Scanability\n\nUse:\n- Clear headings\n- Bullet points\n- Code examples\n- Tables for comparisons\n\n## 5. Include Common Pitfalls\n\nHelp developers avoid common mistakes by documenting them explicitly.',
    'Learn how to write technical documentation that developers will actually read and appreciate.',
    'published',
    NOW() - INTERVAL '3 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Database Design Patterns for SaaS Applications',
    'database-design-patterns-saas',
    E'# Database Design Patterns for SaaS Applications\n\nBuilding a SaaS application requires careful consideration of database design. Let\'s explore common patterns.\n\n## Multi-Tenancy Patterns\n\n### 1. Shared Database, Shared Schema\n\nAll tenants share the same tables:\n\n```sql\nCREATE TABLE posts (\n  id UUID PRIMARY KEY,\n  tenant_id UUID NOT NULL,\n  title TEXT NOT NULL,\n  -- other fields\n);\n```\n\n### 2. Shared Database, Separate Schema\n\nEach tenant gets their own schema:\n\n```sql\nCREATE SCHEMA tenant_123;\nCREATE TABLE tenant_123.posts (...);\n```\n\n### 3. Database per Tenant\n\nComplete isolation but higher operational overhead.\n\n## Row Level Security (RLS)\n\nSupabase makes RLS easy:\n\n```sql\nCREATE POLICY "Users can only see their tenant data"\n  ON posts\n  FOR ALL\n  USING (tenant_id = current_tenant_id());\n```\n\n## Performance Considerations\n\n- Index tenant_id columns\n- Consider partitioning for large tables\n- Monitor query performance per tenant',
    'Explore database design patterns specifically tailored for SaaS applications, including multi-tenancy strategies.',
    'published',
    NOW() - INTERVAL '10 days'
  ),
  
  -- Archived post
  (
    '11111111-1111-1111-1111-111111111111',
    'Introduction to Web Components',
    'introduction-web-components',
    'This is an older post about Web Components that has been archived.',
    'An introduction to Web Components and custom elements.',
    'archived',
    NOW() - INTERVAL '30 days'
  );

-- Link posts to tags
INSERT INTO public.post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM public.posts p, public.tags t
WHERE 
  (p.slug = 'getting-started-nextjs-15-supabase' AND t.slug IN ('nextjs', 'supabase', 'typescript', 'tutorial', 'web-development')) OR
  (p.slug = 'typescript-best-practices-react' AND t.slug IN ('typescript', 'react', 'best-practices', 'web-development')) OR
  (p.slug = 'modern-css-techniques-2024' AND t.slug IN ('design', 'web-development')) OR
  (p.slug = 'technical-documentation-developers-love' AND t.slug IN ('best-practices', 'tutorial')) OR
  (p.slug = 'database-design-patterns-saas' AND t.slug IN ('database', 'supabase', 'best-practices')) OR
  (p.slug = 'introduction-web-components' AND t.slug IN ('javascript', 'web-development'));

-- Add some sample data to verify counts
DO $$
BEGIN
  RAISE NOTICE 'Seed data loaded successfully!';
  RAISE NOTICE 'Users created: %', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE 'Profiles created: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Posts created: %', (SELECT COUNT(*) FROM public.posts);
  RAISE NOTICE 'Tags created: %', (SELECT COUNT(*) FROM public.tags);
  RAISE NOTICE 'Post-tag relationships: %', (SELECT COUNT(*) FROM public.post_tags);
END $$;