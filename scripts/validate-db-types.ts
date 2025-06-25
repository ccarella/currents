#!/usr/bin/env tsx
/**
 * Validates that the committed database types match the remote database schema
 * This script should be run during CI/CD to ensure type safety
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const TYPES_FILE = join(process.cwd(), 'src/types/database.generated.ts');
const TEMP_FILE = join(process.cwd(), 'temp-db-types.ts');

async function validateDatabaseTypes() {
  // Check if we have the required environment variable
  const projectId = process.env.SUPABASE_PROJECT_ID;

  if (!projectId) {
    console.warn(
      '⚠️  SUPABASE_PROJECT_ID not set. Skipping remote type validation.'
    );
    console.warn(
      '   To enable validation, set SUPABASE_PROJECT_ID in your CI environment.'
    );
    process.exit(0);
  }

  console.info('🔍 Validating database types against remote schema...');

  try {
    // Generate types from remote database
    execSync(
      `npx supabase gen types typescript --project-id ${projectId} > ${TEMP_FILE}`,
      { stdio: 'pipe' }
    );

    // Read both files
    const committedTypes = readFileSync(TYPES_FILE, 'utf-8');
    const remoteTypes = readFileSync(TEMP_FILE, 'utf-8');

    // Compare the files (ignoring whitespace differences)
    const normalizeContent = (content: string) =>
      content.replace(/\s+/g, ' ').trim();

    if (normalizeContent(committedTypes) !== normalizeContent(remoteTypes)) {
      console.error('❌ Database types are out of sync!');
      console.error(
        '   The committed types do not match the remote database schema.'
      );
      console.error(
        '   Run "npm run db:types:remote" locally and commit the changes.'
      );

      // Clean up temp file
      execSync(`rm -f ${TEMP_FILE}`);
      process.exit(1);
    }

    console.info('✅ Database types are in sync with remote schema.');

    // Clean up temp file
    execSync(`rm -f ${TEMP_FILE}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to validate database types:', error);

    // Clean up temp file if it exists
    try {
      execSync(`rm -f ${TEMP_FILE}`);
    } catch {}

    process.exit(1);
  }
}

// Run the validation
validateDatabaseTypes();
