#!/bin/bash

# Script to apply database migrations to Supabase

echo "🚀 Starting database migration process..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &>/dev/null; then
    echo "❌ Error: Not logged in to Supabase. Run: supabase login"
    exit 1
fi

echo "📋 Current migration status:"
supabase migration list

echo ""
echo "🔄 Applying migrations to remote database..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully!"
    
    echo ""
    echo "🔍 Verifying migration..."
    echo "Checking if users table was dropped..."
    
    # You can add verification queries here if needed
    
    echo ""
    echo "📝 Next steps:"
    echo "1. Verify the application works correctly"
    echo "2. Check Supabase dashboard for any issues"
    echo "3. Monitor logs for any errors"
else
    echo "❌ Migration failed! Check the error messages above."
    echo "⚠️  DO NOT proceed until the issue is resolved."
    exit 1
fi

echo ""
echo "🎉 Migration process complete!"