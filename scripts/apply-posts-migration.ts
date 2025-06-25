#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const migrationPath = path.join(
  __dirname,
  '../supabase/migrations/20250625_create_posts_table.sql'
);

console.log('Applying posts table migration...');

try {
  // Verify migration file exists
  readFileSync(migrationPath, 'utf-8');

  // Apply migration using Supabase CLI
  execSync('npx supabase db push', { stdio: 'inherit' });

  console.log('✅ Migration applied successfully!');
  console.log('Posts table created with:');
  console.log('- Unique constraint per user (ephemeral posts)');
  console.log('- Automatic slug generation');
  console.log('- Cascade delete on user deletion');
  console.log('- Proper indexes for performance');
  console.log('- Row Level Security policies');
} catch (error) {
  console.error('❌ Failed to apply migration:', error);
  process.exit(1);
}
