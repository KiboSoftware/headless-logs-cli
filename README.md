## Overview

Kibo Headless CLI — manage environment variables, secrets, builds, and logs for your Kibo hosted headless application.

> **Package renamed**: `@kibocommerce/headless-logs-cli` → `@kibocommerce/headless-cli`  
> The old binary `kibo-headless-logs` continues to work as an alias.

## Requirements

* Kibo Tenant ID
* Kibo Site ID
* Kibo Application Key (Client ID)
* Kibo Shared Secret (Client Secret)
* Node >= 18


## Installation

```bash
npm install -g @kibocommerce/headless-cli
```

## Configuration

Use env variables to populate arguments:

```ini
KIBO_TENANT=
KIBO_SITE=
KIBO_CLIENT_ID=
KIBO_CLIENT_SECRET=
```

Or use the init command:

```bash
kibo-headless init -t <tenant-id> -s <site-id> -a <kibo-app-id> -k <secret> -o <output-dir>
```

## Commands

### Environment Variables

```bash
# List all env vars for a branch (.env format output)
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

### Secrets

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

### Builds

```bash
# Trigger a rebuild after config changes
kibo-headless builds trigger --branch main

# Get JSON output for scripting
kibo-headless builds trigger --branch feature-checkout --json
```

### Logs (existing + grouped aliases)

```bash
# Existing flat commands still work
kibo-headless runtime-logs --prefix 2024-07-01
kibo-headless get-build-logs --branch main

# New grouped aliases
kibo-headless logs runtime --prefix 2024-07-01
kibo-headless logs build --branch main
```

## Global Options

All commands accept:

| Flag | Env Var | Description |
|------|---------|-------------|
| `-t, --tenant <id>` | `KIBO_TENANT` | Kibo tenant ID |
| `-s, --site <id>` | `KIBO_SITE` | Kibo site ID |
| `-a, --client-id <id>` | `KIBO_CLIENT_ID` | Kibo application/client ID |
| `-k, --client-secret <secret>` | `KIBO_CLIENT_SECRET` | Kibo shared secret |
| `--home-host <host>` | — | Kibo API home host (default: `home.mozu.com`) |
| `--json` | — | Output raw JSON response |

---

## Legacy Usage (still supported)

This will setup folder and generate an env file for future use

```bash
npm install -g @kibocommerce/headless-logs-cli
mkdir production-logs
cd production-logs
kibo-headless-logs init -t <tenant-id> -s <site-id> -a <kibo-app-id> -k <secret> -o <output-dir>
```

Then run export from this directory to have tenat / site values auto populateds

```bash
kibo-headless-logs runtime-logs --prefix 2024-07-01
```

## Runtime Log Usage

### Filtering Logs

Providing `-p` or `--prefix`, in the format `YYYY-MM-DD-HH` to the command will filter logs to a date range.

Note: Date values are in UTC

#### Logs By Month
```bash
kibo-headless-logs rl -p 2024-07 -o ./runtime-logs -t 1234, -s 321, -a AppKey -k Secret
```
#### Logs By Day
```bash
kibo-headless-logs rl -p 2024-07-01 -o ./runtime-logs -t 1234, -s 321, -a AppKey -k Secret
```
### Logs By Day/Hour
```bash
kibo-headless-logs rl -p 2024-07-01-10 -o ./runtime-logs -t 1234, -s 321, -a AppKey -k Secret
```

### Logs By Day/Hour with Maximum Entries 
```bash
kibo-headless-logs rl -p 2024-07-01-10 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret --maxentries=3
```

### Logs By Day/Hour with Cutoff 
```bash
kibo-headless-logs rl --prefix=2024-12-10-01 --cutoff=2024-12-10-01-15 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret
```

## Build Log Usage

```bash
kibo-headless-logs get-build-logs --output buildlogs --tenant 1234 --site 1234 --client-id AppKey --client-secret Secret --branch kibo-sb-main --numberOfJobs 3 --home-host t1234-s1234.sandbox.mozu.com
```

shorthand;
```bash
kibo-headless-logs gbl --o buildlogs --t 1234 --s 1234 --a AppKey --k Secret --b kibo-sb-main --n 3 --h t1234-s1234.sandbox.mozu.com
```

## Viewer
View exported logs in tool such as https://github.com/allproxy/json-log-viewer