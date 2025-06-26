# Database Migration Guide - Critical Security Update

## Overview

This guide covers the migration process for the critical security update that removes the redundant `users` table and implements secure RLS policies. This is a **BREAKING CHANGE** that requires careful deployment.

## Migration Changes

### What's Changing

1. **Users Table Removal**
   - The `public.users` table is being dropped
   - All user data is consolidated in the `public.profiles` table
   - Email column added to profiles table

2. **Security Improvements**
   - Fixed overly permissive RLS policies
   - Added data integrity constraints
   - Increased password requirements (8 chars with symbols)

3. **Performance Optimizations**
   - Removed redundant indexes
   - Added composite index for post_tags

## Pre-Migration Checklist

- [ ] **Backup your production database**
- [ ] Test migration on staging environment
- [ ] Notify team of maintenance window
- [ ] Review application code for `users` table references
- [ ] Prepare rollback plan

## Migration Steps

### 1. Local Development

Your local database should already be updated after pulling the latest changes:

```bash
# Reset local database with new schema
npm run db:reset
```

### 2. Staging Environment

Test the migration on your staging environment first:

```bash
# Apply migration to staging
supabase migration up --db-url postgresql://[STAGING_CONNECTION_STRING]
```

### 3. Production Deployment

**⚠️ IMPORTANT: This migration will DROP the users table. Ensure all data is backed up.**

#### Option A: Using Supabase CLI (Recommended)

```bash
# Link to your production project
supabase link --project-ref [YOUR_PROJECT_REF]

# Push migrations to production
supabase db push
```

#### Option B: Manual SQL Execution

If you need to run the migration manually:

1. Connect to your production database
2. Run the migration from: `supabase/migrations/20250626000724_fix_critical_security_issues.sql`

### 4. Update Application Code

After the migration, update any code that references the `users` table:

```typescript
// Before
const { data } = await supabase.from('users').select('*');

// After
const { data } = await supabase.from('profiles').select('*');
```

### 5. Update Environment Configuration

Ensure your Supabase configuration matches the new password requirements:

- Minimum length: 8 characters
- Requirements: lowercase, uppercase, digits, and symbols

## Rollback Plan

If issues arise, here's the rollback procedure:

```sql
-- 1. Recreate users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Restore data from profiles
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT id, email, username, created_at, updated_at
FROM public.profiles
WHERE email IS NOT NULL;

-- 3. Restore original RLS policies
-- (See previous migration files for original policies)

-- 4. Remove email column from profiles
ALTER TABLE public.profiles DROP COLUMN email;
```

## Post-Migration Verification

### 1. Check Database Schema

```sql
-- Verify users table is gone
SELECT * FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'users';

-- Verify profiles table has email column
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';
```

### 2. Test Authentication

```typescript
// Test user signup with new password requirements
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123!@#', // Must meet new requirements
});
```

### 3. Verify RLS Policies

```typescript
// Users should only see their own full profile
const { data: myProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Other users' profiles should have limited visibility
const { data: otherProfiles } = await supabase
  .from('profiles')
  .select('username, avatar_url') // Limited fields
  .neq('id', user.id);
```

## Monitoring

After deployment, monitor for:

1. **Authentication Failures**
   - Check Supabase logs for auth errors
   - Monitor user signup/login success rates

2. **RLS Policy Blocks**
   - Look for permission denied errors
   - Check if legitimate access is being blocked

3. **Application Errors**
   - Monitor for "relation does not exist" errors
   - Check for null reference errors

## Support

If you encounter issues:

1. Check Supabase logs: `npm run db:logs`
2. Review migration status in Supabase dashboard
3. Contact the development team with error details

## Timeline

- **Development**: ✅ Complete
- **Staging**: 🔄 Deploy within 24 hours
- **Production**: 📅 Schedule maintenance window
- **Monitoring**: 👀 48 hours post-deployment

---

Last Updated: June 26, 2025
