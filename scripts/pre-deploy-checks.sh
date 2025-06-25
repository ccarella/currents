#!/bin/bash

echo "🚀 Running pre-deployment checks..."

# 1. Type checking
echo "📝 Running TypeScript type checking..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type checking failed!"
  exit 1
fi

# 2. Run validation tests
echo "🧪 Running validation tests..."
npm run test:run -- src/types/__tests__/schemas.test.ts src/lib/validation/__tests__/
if [ $? -ne 0 ]; then
  echo "❌ Validation tests failed!"
  exit 1
fi

# 3. Validate database types if SUPABASE_PROJECT_ID is set
if [ -n "$SUPABASE_PROJECT_ID" ]; then
  echo "🔍 Validating database types against remote..."
  npm run validate:db-types
  if [ $? -ne 0 ]; then
    echo "❌ Database type validation failed!"
    exit 1
  fi
else
  echo "⚠️  SUPABASE_PROJECT_ID not set, skipping remote type validation"
fi

echo "✅ All pre-deployment checks passed!"