# Feature Specification: Headless CLI Environment & Secrets Management

**Feature Branch**: `001-headless-cli-env-secrets`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "Extend the headless-logs-cli to also perform env key/secrets access, build triggers, and permissions management — consuming the APIs defined in Mozu.AppDev spec 004-gcp-amplify-env-mgmt"

## Clarifications

### Session 2026-06-01

- Q: How should secret values be provided to the CLI given shell history exposure risk? → A: Support both --value flag (with shell history warning printed to stderr) and --value-stdin for piped input as the secure alternative.
- Q: What format should env list and secrets list use for human-readable output? → A: Key=value pairs, one per line (.env file format) for env vars; name-only lines for secrets.
- Q: Should the CLI support bulk import/export from .env files? → A: Support env import from .env file; list output in .env format serves as export (pipe to file).
- Q: Should existing commands stay flat or also get grouped aliases? → A: Add grouped aliases (logs runtime, logs build) alongside existing flat command names for consistency.

### Session 2026-09-30

- Q: Does the permissions API still exist? → A: No. The custom permission subsystem (DeveloperPermission endpoints under `developer-accounts/{id}/permissions/headless`) was removed from Mozu.AppDev during PR #192 review; access control uses platform `BehaviorAuthorization` on app credentials instead. **User Story 4 and FR-016..FR-019 are descoped** — the `permissions` command group was removed from the CLI rather than shipping commands that can only 404.
- Q: What is the correct PUT shape for env vars and secrets? → A: `PUT env/{branch}` and `PUT secrets/{branch}` with body `{ "name": ..., "value": ... }` (name in the body, not the route), matching `HeadlessEnvVarInput`/`HeadlessSecretInput` in Mozu.AppDev.Contracts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Manages Environment Variables via CLI (Priority: P1)

A developer building a headless storefront needs to view, set, update, and remove environment variables for their Amplify app branch directly from the command line. Currently, there is no self-service CLI for configuring build-time environment variables — developers must rely on manual processes or direct API calls. After this feature, developers can manage env vars using the same CLI they already use for log access.

**Why this priority**: Environment variable management is the most-requested capability after log access. Developers need a fast workflow: set config → trigger build → check logs. This is the first link in that chain.

**Independent Test**: Can be fully tested by running `kibo-headless env list --branch main`, `kibo-headless env set --branch main --name API_KEY --value test123`, and verifying the variable appears in subsequent list calls.

**Acceptance Scenarios**:

1. **Given** valid Kibo credentials and a configured site, **When** the developer runs `kibo-headless env list --branch main`, **Then** all environment variable names and values for that branch are displayed in `NAME=VALUE` format, one per line.
2. **Given** valid credentials, **When** the developer runs `kibo-headless env set --branch main --name MY_VAR --value my-value`, **Then** the environment variable is created or updated and a confirmation message is displayed.
3. **Given** an existing environment variable, **When** the developer runs `kibo-headless env delete --branch main --name MY_VAR`, **Then** the variable is removed and a confirmation message is displayed.
4. **Given** invalid variable name (e.g., starting with a number), **When** the developer attempts to set it, **Then** a clear validation error is shown before making any API call.
5. **Given** the developer omits the `--branch` flag, **Then** the CLI displays a clear error indicating the branch is required.

---

### User Story 2 - Developer Manages Secrets via CLI (Priority: P2)

A developer needs to store sensitive configuration (database strings, private API keys) for their Amplify app branch. Secrets are write-only — values cannot be retrieved after storage. The CLI must make it clear that secrets behave differently from environment variables.

**Why this priority**: Secrets follow the same workflow as env vars but with stricter access. Developers need both together to fully configure their builds.

**Independent Test**: Can be tested by running `kibo-headless secrets set --branch main --name DB_CONN --value "Server=..."`, then running `kibo-headless secrets list --branch main` and verifying only the name appears (no value).

**Acceptance Scenarios**:

1. **Given** valid credentials, **When** the developer runs `kibo-headless secrets list --branch main`, **Then** only secret names and last-modified dates are displayed — never values.
2. **Given** valid credentials, **When** the developer runs `kibo-headless secrets set --branch main --name DB_CONN --value "connection-string"`, **Then** the secret is stored and a confirmation shows the name only.
3. **Given** an existing secret, **When** the developer runs `kibo-headless secrets delete --branch main --name DB_CONN`, **Then** the secret is removed.
4. **Given** invalid secret name, **When** the developer attempts to set it, **Then** a validation error is shown.

---

### User Story 3 - Developer Triggers a Rebuild After Config Changes (Priority: P2)

After updating environment variables or secrets, a developer needs to trigger an Amplify rebuild so the new configuration takes effect. The CLI should provide a simple command to kick off a build and report its initial status.

**Why this priority**: Triggering a rebuild is the natural next step after setting env vars/secrets. Without this, developers must go to a separate tool to apply their changes.

**Independent Test**: Can be tested by running `kibo-headless builds trigger --branch main` and verifying a job ID and PENDING status are returned.

**Acceptance Scenarios**:

1. **Given** valid credentials and a valid branch, **When** the developer runs `kibo-headless builds trigger --branch main`, **Then** a rebuild is initiated and the response displays the job ID, branch name, status, and start time.
2. **Given** a branch that does not exist in Amplify, **When** the developer triggers a rebuild, **Then** a clear error indicates the branch was not found.
3. **Given** valid credentials, **When** the developer triggers a rebuild with `--json` flag, **Then** the raw JSON response is output for scripting/automation use.

---

### User Story 4 - Account Owner Manages Headless Permissions via CLI (Priority: P3) — **DESCOPED 2026-09-30**

> The server-side permissions API was cut from `004-gcp-amplify-env-mgmt` during PR review. Access control is via `BehaviorAuthorization` on app credentials, configured in Dev Center — there is no endpoint for the CLI to call. This story is retained for history only; the `permissions` command group is not shipped.

A developer account owner needs to control which developers can access logs, manage config, and trigger builds. The CLI should provide commands to list available permissions, view a developer's current permissions, grant permissions, and revoke permissions.

**Why this priority**: Permission management is an admin task needed for production readiness. The core developer workflows (env vars, secrets, builds) must work first.

**Independent Test**: Can be tested by running `kibo-headless permissions list` to see available permissions, then `kibo-headless permissions grant --developer-id 123 --permission HeadlessConfigWrite` and verifying the assignment.

**Acceptance Scenarios**:

1. **Given** valid credentials for an account owner, **When** they run `kibo-headless permissions list`, **Then** all available headless permissions are displayed with descriptions.
2. **Given** an account owner, **When** they run `kibo-headless permissions show --developer-id 123`, **Then** the developer's currently assigned permissions are listed.
3. **Given** an account owner, **When** they run `kibo-headless permissions grant --developer-id 123 --permission HeadlessConfigWrite`, **Then** the permission is granted and confirmed.
4. **Given** an account owner, **When** they run `kibo-headless permissions revoke --developer-id 123 --permission HeadlessConfigWrite`, **Then** the permission is revoked and confirmed.
5. **Given** a non-owner developer, **When** they attempt to grant/revoke permissions, **Then** an authorization error is displayed.

---

### User Story 5 - CLI Rename and Backward Compatibility (Priority: P1)

The CLI is being renamed from `kibo-headless-logs` to `kibo-headless` to reflect its broader scope. Existing users who have installed the package should not experience a breaking change — the old binary name should still work during a transition period.

**Why this priority**: Renaming is a breaking change for existing users. It must be handled carefully as part of the core release.

**Independent Test**: Can be tested by verifying both `kibo-headless` and `kibo-headless-logs` binary names resolve after installation, and that existing `runtime-logs` and `get-build-logs` commands still work under both names.

**Acceptance Scenarios**:

1. **Given** a user installs the updated package, **When** they run `kibo-headless runtime-logs`, **Then** the existing runtime logs functionality works unchanged.
2. **Given** a user has the old binary name in scripts, **When** they run `kibo-headless-logs runtime-logs`, **Then** it still works (backward-compatible alias).
3. **Given** the updated package, **When** a user runs `kibo-headless --help`, **Then** all command groups are listed: `env`, `secrets`, `builds`, `logs`, `runtime-logs`, `get-build-logs`, `init`, `env-template`.

---

### Edge Cases

- What happens when the API returns a 403 (permission denied)? CLI displays a clear message indicating which permission is required.
- What happens when the API returns a 502 (GCP-to-AWS auth failure)? CLI surfaces the diagnostic error from the API response.
- What happens when network connectivity is lost mid-operation? CLI displays a connection error with the attempted endpoint.
- What happens when the `--branch` name contains special characters (e.g., `feature/my-branch`)? CLI passes it through — server-side handles sanitization.
- What happens when listing env vars/secrets returns an empty set? CLI displays "No environment variables found for branch: main" (or similar).
- What happens when setting a secret value that is too long (>4096 chars)? CLI validates locally and displays error before sending.

## Requirements *(mandatory)*

### Functional Requirements

**Package & CLI Rename**

- **FR-001**: Package MUST be renamed from `@kibocommerce/headless-logs-cli` to `@kibocommerce/headless-cli` with binary name `kibo-headless`.
- **FR-002**: The old binary name `kibo-headless-logs` MUST be retained as an alias for backward compatibility.
- **FR-003**: All existing commands (`runtime-logs`, `get-build-logs`, `init`, `env-template`) MUST continue to function unchanged.
- **FR-003a**: Grouped aliases MUST be added for existing log commands: `logs runtime` (alias for `runtime-logs`) and `logs build` (alias for `get-build-logs`) for consistency with the new subcommand group structure.

**Command Structure**

- **FR-004**: New commands MUST be organized as subcommand groups: `env`, `secrets`, `builds`.
- **FR-005**: All new commands MUST accept the same authentication options as existing commands: `--tenant`, `--site`, `--client-id`, `--client-secret`, `--home-host` (with env var fallbacks via KIBO_TENANT, KIBO_SITE, etc.).
- **FR-006**: All new commands MUST require `--branch` for operations scoped to an Amplify branch.

**Environment Variable Commands**

- **FR-007**: `env list --branch <branch>` MUST display all environment variable names and values in `NAME=VALUE` format, one per line (`.env` file compatible), for the specified branch.
- **FR-008**: `env set --branch <branch> --name <name> --value <value>` MUST create or update the specified environment variable.
- **FR-009**: `env delete --branch <branch> --name <name>` MUST remove the specified environment variable.
- **FR-009a**: `env import --branch <branch> --file <path>` MUST read a `.env`-formatted file and create/update all variables found in it for the specified branch. Lines starting with `#` and empty lines MUST be ignored.
- **FR-010**: Variable names MUST be validated locally against `^[A-Za-z_][A-Za-z0-9_]*$` before sending to the API.

**Secret Commands**

- **FR-011**: `secrets list --branch <branch>` MUST display secret names one per line (with last-modified date appended as a comment) — never values.
- **FR-012**: `secrets set --branch <branch> --name <name> --value <value>` MUST store the secret and display only the name in confirmation.
- **FR-012a**: `secrets set` MUST also support `--value-stdin` flag to read the secret value from standard input (pipe-safe for CI/CD and secure usage).
- **FR-012b**: When `--value` is used with `secrets set`, the CLI MUST print a warning to stderr indicating the value may be visible in shell history and recommending `--value-stdin` for production use.
- **FR-013**: `secrets delete --branch <branch> --name <name>` MUST remove the specified secret.

**Build Commands**

- **FR-014**: `builds trigger --branch <branch>` MUST trigger an Amplify rebuild and display the job ID, branch, status, and start time.
- **FR-015**: `builds trigger` MUST support a `--json` flag for raw JSON output suitable for scripting.

**Permission Commands** — *descoped 2026-09-30: server-side permissions API removed during AppDev PR #192 review; no endpoints exist to call.*

- ~~**FR-016**: `permissions list` MUST display all available headless permissions with their descriptions.~~
- ~~**FR-017**: `permissions show --developer-id <id>` MUST display the specified developer's current permission assignments.~~
- ~~**FR-018**: `permissions grant --developer-id <id> --permission <name>` MUST grant the specified permission.~~
- ~~**FR-019**: `permissions revoke --developer-id <id> --permission <name>` MUST revoke the specified permission.~~

**Output & Error Handling**

- **FR-020**: All commands MUST display human-readable output by default.
- **FR-021**: All commands MUST support a `--json` flag to output raw API responses for scripting.
- **FR-022**: API errors MUST be displayed with the error code and message from the server response.
- **FR-023**: Network/connection errors MUST display a user-friendly message with the target URL.

**Service Layer**

- **FR-024**: A new service class MUST be created to handle API calls to the env, secrets, and builds endpoints, following the same authenticated request pattern as the existing `LogService`.

## Success Criteria

- Developers can manage environment variables for a headless app branch in under 30 seconds per operation (list/set/delete cycle).
- Developers can store and manage secrets without ever seeing secret values echoed back.
- Developers can trigger a rebuild immediately after config changes without leaving the terminal.
- Existing CLI users experience zero disruption — old commands and binary name continue to work.
- All operations provide clear, actionable feedback on success and failure.

### Key Entities

- **Environment Variable**: A non-sensitive key-value configuration pair scoped to an Amplify app branch. Key attributes: name, value, branch name.
- **Secret**: A sensitive key-value pair scoped to an Amplify app branch. Value is write-only (never displayed after storage). Key attributes: name, branch name.
- **Build Trigger**: A request to start an Amplify rebuild for a specific branch. Key attributes: job ID, branch name, status, start time.
- **Developer Permission**: An access control assignment linking a developer to a headless capability (HeadlessLogsRead, HeadlessConfigWrite, HeadlessBuildTrigger). Key attributes: permission name, developer ID, granted by, grant date.

## Assumptions

- The AppDev API endpoints defined in the `004-gcp-amplify-env-mgmt` spec will be available and deployed before this CLI is released.
- The existing `@kibocommerce/sdk-authentication` package handles all OAuth token management — no additional auth logic needed.
- The API base path is `https://{homeHost}/api/platform/appdev/headless-app/` — consistent with existing log endpoints.
- The `commander` library (already a dependency) supports subcommand groups natively.
- Variable/secret name validation rules (`^[A-Za-z_][A-Za-z0-9_]*$`) match server-side validation.
- The `--home-host` default remains `home.mozu.com`.
