# CLI Command Contract: Headless CLI

**Feature**: `001-headless-cli-env-secrets`  
**Binary**: `kibo-headless` (alias: `kibo-headless-logs`)  
**Date**: 2026-06-01

## Global Options (all commands)

| Flag | Env Var | Required | Default | Description |
|------|---------|----------|---------|-------------|
| `-t, --tenant <id>` | `KIBO_TENANT` | Yes | — | Kibo tenant ID |
| `-s, --site <id>` | `KIBO_SITE` | Yes | — | Kibo site ID |
| `-a, --client-id <id>` | `KIBO_CLIENT_ID` | Yes | — | Kibo application/client ID |
| `-k, --client-secret <secret>` | `KIBO_CLIENT_SECRET` | Yes | — | Kibo shared secret |
| `--home-host <host>` | — | No | `home.mozu.com` | Kibo API home host |
| `--json` | — | No | `false` | Output raw JSON response |

---

## Environment Variable Commands (`env`)

### `kibo-headless env list`

List all environment variables for a branch.

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |

**Stdout (default)**: One line per variable in `NAME=VALUE` format (`.env` compatible)
```
API_KEY=sk-123abc
FEATURE_FLAG=true
NEXT_PUBLIC_SITE=mystore
```

**Stdout (--json)**: Raw API response
```json
{"items":[{"name":"API_KEY","value":"sk-123abc","lastModified":"2026-06-01T12:00:00Z"},...]}  

**Stderr (empty result)**: `No environment variables found for branch: main`  
**Exit code**: `0` on success, `1` on error

---

### `kibo-headless env set`

Create or update an environment variable.

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |
| `-n, --name <name>` | Yes | Variable name |
| `--value <value>` | Yes (or --value-stdin) | Variable value |
| `--value-stdin` | No | Read value from stdin pipe |

**Stdout (default)**: `Set: MY_VAR`  
**Stdout (--json)**: Raw API response  
**Stderr (validation error)**: `Error: Invalid variable name "123bad". Names must match [A-Za-z_][A-Za-z0-9_]*`  
**Exit code**: `0` on success, `1` on error

---

### `kibo-headless env delete`

Delete an environment variable.

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |
| `-n, --name <name>` | Yes | Variable name to delete |

**Stdout (default)**: `Deleted: MY_VAR`  
**Stdout (--json)**: `{}`  
**Exit code**: `0` on success, `1` on error

---

### `kibo-headless env import`

Import variables from a `.env` file (bulk create/update).

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |
| `-f, --file <path>` | Yes | Path to `.env` file |

**Stdout (default)**:
```
Importing 5 variables from .env.production...
Set: API_KEY
Set: DB_HOST
Set: DB_PORT
Set: CACHE_TTL
Set: LOG_LEVEL
Import complete: 5 variables set for branch main
```

**Stderr (file not found)**: `Error: File not found: .env.production`  
**Stderr (parse error)**: `Warning: Skipped invalid line 7: "=no-name"`  
**Exit code**: `0` on success (even with warnings), `1` on hard error

---

## Secret Commands (`secrets`)

### `kibo-headless secrets list`

List secret names (never values) for a branch.

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |

**Stdout (default)**: Secret names with last-modified as comment
```
DB_CONNECTION_STRING  # 2026-06-01T12:00:00Z
PRIVATE_API_KEY  # 2026-05-30T08:15:00Z
```

**Stdout (--json)**: Raw API response (names only, no values)
```json
{"items":[{"name":"DB_CONNECTION_STRING","lastModified":"2026-06-01T12:00:00Z"},{"name":"PRIVATE_API_KEY","lastModified":"2026-05-30T08:15:00Z"}]}
```

**Stderr (empty result)**: `No secrets found for branch: main`  
**Exit code**: `0` on success, `1` on error

---

### `kibo-headless secrets set`

Store or update a secret (write-only).

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |
| `-n, --name <name>` | Yes | Secret name |
| `--value <value>` | Yes (or --value-stdin) | Secret value |
| `--value-stdin` | No | Read value from stdin pipe |

**Stdout (default)**: `Set secret: DB_CONNECTION_STRING`  
**Stderr (when --value used)**: `⚠ Warning: Secret value may be visible in shell history. Use --value-stdin for production: echo $SECRET | kibo-headless secrets set --value-stdin -b main -n NAME`  
**Stdout (--json)**: `{"name":"DB_CONNECTION_STRING"}`  
**Exit code**: `0` on success, `1` on error

---

### `kibo-headless secrets delete`

Remove a secret.

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |
| `-n, --name <name>` | Yes | Secret name to delete |

**Stdout (default)**: `Deleted secret: DB_CONNECTION_STRING`  
**Stdout (--json)**: `{}`  
**Exit code**: `0` on success, `1` on error

---

## Build Commands (`builds`)

### `kibo-headless builds trigger`

Trigger an Amplify rebuild for a branch.

| Flag | Required | Description |
|------|----------|-------------|
| `-b, --branch <name>` | Yes | Amplify branch name |

**Stdout (default)**:
```
Build triggered for branch: main
Job ID:    abc-123
Status:    PENDING
Started:   2026-06-01T12:00:00Z
```

**Stdout (--json)**:
```json
{"jobId":"abc-123","branchName":"main","status":"PENDING","startTime":"2026-06-01T12:00:00Z"}
```

**Exit code**: `0` on success, `1` on error

---

## Permission Commands (`permissions`) — **REMOVED**

The `developer-accounts/{id}/permissions/headless` API was cut from Mozu.AppDev during
`004-gcp-amplify-env-mgmt` PR review (access is controlled by platform
`BehaviorAuthorization` on app credentials instead). The `permissions` command group
was removed from the CLI on 2026-09-30 rather than shipping commands that always 404.

---

## Log Commands (`logs`) — Grouped Aliases

### `kibo-headless logs runtime`

Alias for `kibo-headless runtime-logs`. All options identical.

### `kibo-headless logs build`

Alias for `kibo-headless get-build-logs`. All options identical.

---

## Error Output Format

All errors go to stderr. Format:

**API error**:
```
Error [HEADLESS_FORBIDDEN]: Developer lacks required permission
  Permission required: HeadlessConfigWrite
```

**Network error**:
```
Error: Unable to connect to https://home.mozu.com/api/platform/appdev/headless-app/env/main
  Check your network connection and --home-host value
```

**Validation error**:
```
Error: Invalid variable name "123bad". Names must match [A-Za-z_][A-Za-z0-9_]*
```
