#!/bin/bash

# Script to add GitHub secrets from .env.local file

if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found!"
    echo "Please ensure you're in the project root directory."
    exit 1
fi

echo "Adding GitHub secrets from .env.local..."

# Function to add a secret
add_secret() {
    local secret_name=$1
    local secret_value=$(grep "^${secret_name}=" .env.local | cut -d '=' -f2-)
    
    if [ -z "$secret_value" ]; then
        echo "Warning: ${secret_name} not found in .env.local"
        return
    fi
    
    echo "Adding ${secret_name}..."
    echo "$secret_value" | gh secret set "$secret_name"
    
    if [ $? -eq 0 ]; then
        echo "✓ ${secret_name} added successfully"
    else
        echo "✗ Failed to add ${secret_name}"
    fi
}

# Add each required secret
add_secret "NEXT_PUBLIC_SUPABASE_URL"
add_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_secret "SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "Done! You can verify the secrets were added by running:"
echo "gh secret list"