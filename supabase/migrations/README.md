# Database Migrations

This directory contains all database migrations for the Currents project.

## Overview

We use Supabase's migration system to manage database schema changes. Migrations are SQL files that are applied in order to build the database schema.

## Current Schema

The database includes the following main tables:

1. **profiles** - User profile information
2. **posts** - Blog posts with status management
3. **tags** - Tag system for categorizing posts
4. **post_tags** - Junction table for many-to-many relationship
5. **users** - User account information

All tables include Row Level Security (RLS) policies to ensure data isolation and security.

## Migration Commands

### Creating a New Migration

```bash
npm run db:migrate <migration_name>
```

This creates a new migration file in the format: `YYYYMMDDHHMMSS_migration_name.sql`

### Applying Migrations

```bash
npm run db:migrate:up
```

Applies all pending migrations to your local database.

### Listing Migrations

```bash
npm run db:migrate:list
```

Shows all migrations and their status (applied/pending).

### Pushing to Production

```bash
npm run db:push
```

Pushes local migrations to the linked Supabase project.

## Seeding Data

### Development Seed Data

To populate your local database with test data:

```bash
npm run db:seed
```

This command:

1. Resets the database to a clean state
2. Applies all migrations
3. Runs the seed script with test data

### Seed Only (Without Reset)

To add seed data without resetting:

```bash
npm run db:seed:only
```

### Hard Reset (Development Only)

To completely clear all data without re-running migrations:

```bash
npm run db:reset:hard
```

**WARNING**: This deletes all data and should only be used in development.

## Test Data

The seed script creates:

- 3 test users (alice@example.com, bob@example.com, charlie@example.com)
- All test users have the password: `Test123!@#`
- Sample blog posts in various states (published, draft, archived)
- Tags and post-tag relationships

## Best Practices

1. **Always test migrations locally** before pushing to production
2. **Make migrations idempotent** - they should be safe to run multiple times
3. **Include rollback logic** in complex migrations when possible
4. **Use transactions** for multi-step migrations
5. **Document breaking changes** in migration files

## Migration File Structure

Each migration should follow this structure:

```sql
-- Migration: Brief description
-- Author: Your name
-- Date: YYYY-MM-DD

-- Forward migration
BEGIN;

-- Your schema changes here

COMMIT;

-- Rollback (optional but recommended)
-- BEGIN;
-- -- Rollback logic here
-- COMMIT;
```

## Type Generation

After making schema changes, regenerate TypeScript types:

```bash
npm run db:types
```

This updates `src/types/database.generated.ts` with the latest schema types.

## Troubleshooting

### Migration Failed

1. Check the Supabase logs: `npm run db:status`
2. Review the migration file for syntax errors
3. Ensure you're connected to the local database
4. Try resetting and re-applying: `npm run db:reset`

### Types Out of Sync

If TypeScript types don't match your schema:

```bash
npm run db:types
```

### Seed Data Issues

If seed data fails to load:

1. Ensure Supabase is running: `npm run db:status`
2. Check for constraint violations in the seed script
3. Run hard reset and try again: `npm run db:reset:hard && npm run db:seed:only`
