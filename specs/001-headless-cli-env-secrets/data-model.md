# Data Model: Headless CLI Environment & Secrets Management

**Feature**: `001-headless-cli-env-secrets`  
**Date**: 2026-06-01

## Overview

This CLI is a thin client — it has no local database or persistent data store. The data model describes the shapes flowing between the CLI and the AppDev API, and the internal structures used for command processing.

## API Response Entities

### HeadlessEnvVar

Represents a non-sensitive environment variable scoped to an Amplify app branch.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Variable name (matches `^[A-Za-z_][A-Za-z0-9_]*$`) |
| `value` | string | Variable value (max 4096 chars) |
| `lastModified` | string (ISO 8601) | Last modification timestamp |

**Collection**: `{ items: HeadlessEnvVar[] }`

### HeadlessSecret

Represents a sensitive secret scoped to an Amplify app branch. Value is write-only.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Secret name (matches `^[A-Za-z_][A-Za-z0-9_]*$`) |
| `lastModified` | string (ISO 8601) | Last modification timestamp |

**Note**: `value` is accepted in PUT requests but NEVER returned in GET responses.

**Collection**: `{ items: HeadlessSecret[] }`

### HeadlessBuildTriggerResponse

Represents the result of triggering an Amplify rebuild.

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | string | Amplify build job identifier |
| `branchName` | string | Branch that was rebuilt |
| `status` | string | Build status (`PENDING`, `RUNNING`, etc.) |
| `startTime` | string (ISO 8601) | Build start timestamp |

### DeveloperPermission

Represents an available headless permission definition.

| Field | Type | Description |
|-------|------|-------------|
| `permissionId` | number | Unique permission identifier |
| `permissionName` | string | Permission key (e.g., `HeadlessLogsRead`) |
| `description` | string | Human-readable description |

**Collection**: `{ items: DeveloperPermission[] }`

### DeveloperPermissionAssignment

Represents a permission granted to a specific developer.

| Field | Type | Description |
|-------|------|-------------|
| `permissionId` | number | Permission identifier |
| `permissionName` | string | Permission key |
| `grantedBy` | string | Email/name of the granter |
| `grantedDate` | string (ISO 8601) | When the permission was granted |

**Collection**: `{ items: DeveloperPermissionAssignment[] }`

### API Error Response

Standard error shape returned by all endpoints on failure.

| Field | Type | Description |
|-------|------|-------------|
| `errorCode` | string | Machine-readable error code |
| `message` | string | Human-readable error description |
| `additionalErrorData` | `{name, value}[]` | Optional diagnostic key-value pairs |

**Known error codes**: `HEADLESS_AUTH_FAILED` (502), `HEADLESS_NOT_FOUND` (404), `HEADLESS_FORBIDDEN` (403), `HEADLESS_INVALID_VAR_NAME` (400), `HEADLESS_BRANCH_NOT_FOUND` (404)

## Internal CLI Structures

### ParsedEnvEntry

Used internally when parsing `.env` files for the `env import` command.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Variable name extracted from the line |
| `value` | string | Variable value (everything after first `=`) |

### CommandContext

Represents the resolved options available to every command action. Not a formal class — assembled from Commander's parsed options.

| Field | Type | Source |
|-------|------|--------|
| `tenant` | string | `--tenant` / `KIBO_TENANT` |
| `site` | string | `--site` / `KIBO_SITE` |
| `clientId` | string | `--client-id` / `KIBO_CLIENT_ID` |
| `clientSecret` | string | `--client-secret` / `KIBO_CLIENT_SECRET` |
| `homeHost` | string | `--home-host` (default: `home.mozu.com`) |
| `branch` | string | `--branch` (required for scoped commands) |
| `json` | boolean | `--json` flag for raw output |
| `developerAccountId` | string | `--developer-account-id` / `KIBO_DEVELOPER_ACCOUNT_ID` (permissions only) |

## Validation Rules

| Rule | Applies To | Regex/Constraint |
|------|-----------|------------------|
| Variable/secret name | `env set`, `secrets set`, `env import` | `^[A-Za-z_][A-Za-z0-9_]*$` |
| Value max length | `env set`, `secrets set` | ≤ 4096 characters |
| Branch required | All scoped commands | Non-empty string |

## Relationships

```text
HeadlessEnvVar ──── scoped to ────→ (amplifyAppId, branchName)
HeadlessSecret ──── scoped to ────→ (amplifyAppId, branchName)
BuildTrigger ────── targets ──────→ branchName
Permission ──────── assigned to ──→ (developerId, developerAccountId)
```

The CLI does NOT manage `amplifyAppId` directly — the server resolves it from the tenant/site context headers. The CLI only needs to know the `branch`.
