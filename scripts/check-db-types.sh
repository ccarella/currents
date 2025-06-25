#!/bin/bash

# Check if Supabase is running
if ! npx supabase status 2>/dev/null | grep -q "DB URL"; then
  echo "⚠️  Supabase is not running. Skipping type generation check."
  exit 0
fi

# Generate types to a temporary file
TEMP_FILE=$(mktemp)
npx supabase gen types typescript --local > "$TEMP_FILE" 2>/dev/null

# Compare with existing types
if ! diff -q "$TEMP_FILE" src/types/database.generated.ts > /dev/null 2>&1; then
  echo "📝 Database types have changed. Regenerating..."
  cp "$TEMP_FILE" src/types/database.generated.ts
  git add src/types/database.generated.ts
  echo "✅ Database types updated and staged."
else
  echo "✅ Database types are up to date."
fi

# Clean up
rm -f "$TEMP_FILE"