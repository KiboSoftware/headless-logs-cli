# Quickstart: Headless CLI Environment & Secrets Management

**Feature**: `001-headless-cli-env-secrets`  
**Date**: 2026-06-01

## Prerequisites

- Node.js 18+ installed
- Kibo developer account credentials (client ID + secret)
- Tenant and site IDs for your headless app

## Installation

```bash
npm install -g @kibocommerce/headless-cli
```

## Configuration

Create a `.env` file or export environment variables:

```bash
export KIBO_TENANT=12345
export KIBO_SITE=67890
export KIBO_CLIENT_ID=your-app-id
export KIBO_CLIENT_SECRET=your-shared-secret
```

Or use the init command:

```bash
kibo-headless init --tenant 12345 --site 67890 --client-id your-app-id --client-secret your-secret
```

## Quick Usage Examples

### Manage Environment Variables

```bash
# List all env vars for a branch
kibo-headless env list --branch main

# Set a variable
kibo-headless env set --branch main --name API_KEY --value sk-123abc

# Delete a variable
kibo-headless env delete --branch main --name API_KEY

# Import from a .env file
kibo-headless env import --branch main --file .env.production

# Export to a file (list outputs .env format)
kibo-headless env list --branch main > .env.staging
```

### Manage Secrets

```bash
# List secret names (values are never shown)
kibo-headless secrets list --branch main

# Set a secret (secure method via pipe)
echo "$DB_CONNECTION_STRING" | kibo-headless secrets set --branch main --name DB_CONN --value-stdin

# Set a secret (quick method — shows shell history warning)
kibo-headless secrets set --branch main --name STRIPE_KEY --value sk_live_abc123

# Delete a secret
kibo-headless secrets delete --branch main --name DB_CONN
```

### Trigger Builds

```bash
# Trigger a rebuild after config changes
kibo-headless builds trigger --branch main

# Get JSON output for scripting
kibo-headless builds trigger --branch feature-checkout --json
```

### Manage Permissions (Account Owners)

```bash
# List available permissions
kibo-headless permissions list --developer-account-id 100

# Show a developer's permissions
kibo-headless permissions show --developer-account-id 100 --developer-id 42

# Grant a permission
kibo-headless permissions grant --developer-account-id 100 --developer-id 42 --permission HeadlessConfigWrite

# Revoke a permission
kibo-headless permissions revoke --developer-account-id 100 --developer-id 42 --permission HeadlessConfigWrite
```

### Access Logs (existing + new aliases)

```bash
# Existing commands still work
kibo-headless runtime-logs --branch main
kibo-headless get-build-logs --branch main

# New grouped aliases
kibo-headless logs runtime --branch main
kibo-headless logs build --branch main
```

## Common Workflows

### Deploy New Configuration

```bash
# 1. Set variables
kibo-headless env set -b staging --name NEXT_PUBLIC_API_URL --value https://api.staging.example.com
kibo-headless secrets set -b staging --name DATABASE_URL --value-stdin <<< "$DB_URL"

# 2. Trigger rebuild
kibo-headless builds trigger -b staging

# 3. Check build logs
kibo-headless get-build-logs -b staging
```

### Migrate Config Between Branches

```bash
# Export from production
kibo-headless env list -b main > .env.production

# Edit for staging values, then import
kibo-headless env import -b staging --file .env.production
```

### CI/CD Integration

```bash
# In a CI pipeline (all values from env vars)
export KIBO_TENANT=12345
export KIBO_SITE=67890
export KIBO_CLIENT_ID=$CI_KIBO_CLIENT_ID
export KIBO_CLIENT_SECRET=$CI_KIBO_SECRET

# Set secrets securely via stdin (no shell history)
echo "$DEPLOY_SECRET" | kibo-headless secrets set -b main -n DEPLOY_KEY --value-stdin

# Trigger rebuild and capture job ID
JOB_ID=$(kibo-headless builds trigger -b main --json | jq -r '.jobId')
echo "Build started: $JOB_ID"
```

## Backward Compatibility

The old binary name still works:

```bash
# These are equivalent
kibo-headless-logs runtime-logs --branch main
kibo-headless runtime-logs --branch main
```

## Development

```bash
# Run tests
npm test

# Run a specific test
node --test tests/env-list.test.js
```
