# Implementation Plan: Headless CLI Environment & Secrets Management

**Branch**: `001-headless-cli-env-secrets` | **Date**: 2026-06-01 | **Spec**: `specs/001-headless-cli-env-secrets/spec.md`  
**Input**: Feature specification from `/specs/001-headless-cli-env-secrets/spec.md`

## Summary

Extend the `@kibocommerce/headless-logs-cli` into a broader headless management CLI (`@kibocommerce/headless-cli`) by adding environment variable CRUD, secrets management, build trigger, and permissions commands — all consuming the new AppDev API surface defined in the Mozu.AppDev `004-gcp-amplify-env-mgmt` spec. The CLI is renamed with backward-compatible alias retention, and existing commands gain grouped aliases for consistency.

## Technical Context

**Language/Version**: JavaScript (ES Modules) / Node.js 18+  
**Primary Dependencies**: commander 12.x, @kibocommerce/sdk-authentication 1.x, dotenv 16.x, node-jq 6.x (existing only for runtime-logs)  
**Storage**: N/A (CLI tool — no local persistence beyond .env)  
**Testing**: Node.js built-in test runner (`node:test`) — no new dependencies needed (Node 18+ includes it)  
**Target Platform**: Cross-platform CLI (macOS, Linux, Windows via Node.js)  
**Project Type**: CLI  
**Performance Goals**: All operations complete in < 30 seconds; network-bound by API latency  
**Constraints**: Backward-compatible binary name, no breaking changes to existing commands, secrets never echoed  
**Scale/Scope**: Single-user CLI tool; API returns all items in a single response (no pagination)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. Smallest Viable Change** | PASS | Extends existing CLI with new commands/service following existing `LogService` pattern. No refactoring of existing code. Package rename is a `package.json` change + alias in `bin`. |
| **II. CLI Contract Stability** | PASS | All existing commands preserved unchanged. Old binary `kibo-headless-logs` retained as alias. New commands are purely additive. Breaking change (package rename) is documented and versioned. |
| **III. Test-Driven Delivery** | PLAN | Will use Node.js built-in `node:test` (no dependency needed). First test: `env list` command returns .env-formatted output from mocked API. Failing test written before implementation. |
| **IV. Dependency and Pattern Approval** | PASS | No new npm dependencies required. `node:test` is built-in. Commander subcommand groups are already supported by existing `commander` dependency. Following existing `LogService` class pattern for new `HeadlessService`. |
| **V. Explicit Failures and Operability** | PASS | Error handling defined in spec (FR-020 through FR-023). Secret values never echoed. Shell history warning on `--value`. README update required. |

**Smallest failing test**: `node --test tests/env-list.test.js` — asserts that `env list --branch main` outputs `NAME=VALUE\n` format to stdout when the API returns a known fixture. Fails because the command doesn't exist yet.

**Existing files reused**: `bin/index.js` (add new commands), `services/LogService.js` (pattern for new service).

**CLI contract changes**: Package renamed to `@kibocommerce/headless-cli`; new binary `kibo-headless` added; old binary retained. New subcommands: `env`, `secrets`, `builds`, `permissions`, `logs`. All additive.

**New patterns/dependencies**: None. Using existing `commander` subcommand API and existing `LogService` authenticated-request pattern.

**Post-change validation**: `node --test` (runs all tests); manual smoke: `kibo-headless env list --branch main --json`

## Project Structure

### Documentation (this feature)

```text
specs/001-headless-cli-env-secrets/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli-commands.md  # CLI command contract (inputs/outputs)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
bin/
├── index.js                    # MODIFY: rename program, add subcommand groups, retain old alias
├── kibo-headless-logs.js       # NEW: thin wrapper that re-exports index.js (backward compat alias)

commands/
├── get-build-logs.js           # EXISTING: no changes
├── runtime-logs.js             # EXISTING: no changes
├── env.js                      # NEW: env list, set, delete, import subcommands
├── secrets.js                  # NEW: secrets list, set, delete subcommands
├── builds.js                   # NEW: builds trigger subcommand
└── permissions.js              # NEW: permissions list, show, grant, revoke subcommands

services/
├── LogService.js               # EXISTING: no changes
└── HeadlessService.js          # NEW: authenticated API calls for env/secrets/builds/permissions

util/
├── decompression.js            # EXISTING: no changes
├── validation.js               # NEW: variable name validation, value length check
└── output.js                   # NEW: formatters (env format, json, error display)

tests/
├── env-list.test.js            # NEW: env list command tests
├── env-set.test.js             # NEW: env set command tests  
├── secrets.test.js             # NEW: secrets command tests
├── builds.test.js              # NEW: builds trigger tests
├── permissions.test.js         # NEW: permissions command tests
├── validation.test.js          # NEW: name validation unit tests
└── helpers/
    └── mock-service.js         # NEW: mock HeadlessService for command tests

package.json                    # MODIFY: rename, add bin alias, add test script
README.md                       # MODIFY: add new command documentation
```

**Structure Decision**: All new code follows the existing flat structure — commands in `commands/`, services in `services/`, utilities in `util/`. No new directories beyond `tests/` (which is standard for any project with tests). No frameworks, no abstractions beyond what exists.

## Complexity Tracking

| Addition | Justification | Simpler Alternative Rejected Because |
|----------|---------------|-------------------------------------|
| `HeadlessService` class | Need authenticated HTTP calls to 4 new endpoint groups; follows existing `LogService` pattern | Inlining fetch calls in each command — rejected because it duplicates auth/header logic 5+ times |
| `util/output.js` | Two formatters (env-format, json) used across all commands | Inline formatting in each command — rejected because the same .env output format is used in 3+ places |
| `util/validation.js` | Name validation regex + value length check shared between env and secrets | Inline in commands — rejected because it's used in both `env set` and `secrets set` plus `env import` |
| `tests/` directory | Constitution requires TDD; built-in `node:test` needs no dependencies | No tests — rejected because constitution is NON-NEGOTIABLE on this |

## Post-Design Constitution Re-Check

| Gate | Status | Notes |
|------|--------|-------|
| **I. Smallest Viable Change** | PASS | 4 new command files, 1 new service, 2 small utils. Existing files touched: `bin/index.js` (add command groups), `package.json` (rename + bin entries + test script), `README.md`. No refactors. |
| **II. CLI Contract Stability** | PASS | Old binary `kibo-headless-logs` retained. All existing commands unchanged. New commands purely additive. Rename documented in plan and versioned as 2.0.0. |
| **III. Test-Driven Delivery** | PASS | Test strategy defined: `node:test` built-in, mock service injection, tests written before commands. First failing test: `env list` outputs .env format. |
| **IV. Dependency and Pattern Approval** | PASS | Zero new npm packages. `node:test` is built-in. `HeadlessService` follows exact `LogService` pattern. Commander subcommand groups use existing `commander` API. |
| **V. Explicit Failures and Operability** | PASS | Error output contract defined in `contracts/cli-commands.md`. Secrets never echoed. Shell history warning on `--value`. README update is a task. |
