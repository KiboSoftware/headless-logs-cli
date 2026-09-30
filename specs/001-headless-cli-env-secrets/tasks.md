# Tasks: Headless CLI Environment & Secrets Management

**Input**: Design documents from `/specs/001-headless-cli-env-secrets/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/cli-commands.md ✓

**Tests**: REQUIRED per Constitution Gate III (TDD NON-NEGOTIABLE). Tests written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, package rename, and test framework configuration

- [x] T001 Rename package to `@kibocommerce/headless-cli` and add dual bin entries in package.json
- [x] T002 [P] Add `"test": "node --test"` script in package.json
- [x] T003 [P] Create tests/helpers/mock-service.js with mock HeadlessService for command tests
- [x] T004 [P] Create util/validation.js with name validation regex `^[A-Za-z_][A-Za-z0-9_]*$` and value length check (max 4096)
- [x] T005 [P] Create util/output.js with formatters (env format, json, error display)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core service class that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Write failing test for HeadlessService authenticated request pattern in tests/headless-service.test.js
- [x] T007 Create services/HeadlessService.js following LogService pattern (authenticated HTTP calls, error handling, base path resolution)
- [x] T008 Restructure bin/index.js to use Commander addCommand() with subcommand groups (`env`, `secrets`, `builds`, `permissions`, `logs`)
- [x] T009 Add grouped aliases `logs runtime` and `logs build` for existing flat commands in bin/index.js

**Checkpoint**: Foundation ready — HeadlessService handles authenticated API calls, CLI structure accepts subcommand groups

---

## Phase 3: User Story 1 — Developer Manages Environment Variables via CLI (Priority: P1) 🎯 MVP

**Goal**: Developers can list, set, delete, and bulk-import environment variables for an Amplify app branch

**Independent Test**: `kibo-headless env list --branch main`, `kibo-headless env set --branch main --name API_KEY --value test123`, verify variable appears in subsequent list

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Write failing test for `env list` outputting NAME=VALUE format in tests/env-list.test.js
- [x] T011 [P] [US1] Write failing test for `env set` creating/updating a variable in tests/env-set.test.js
- [x] T012 [P] [US1] Write failing test for `env delete` removing a variable in tests/env-set.test.js
- [x] T013 [P] [US1] Write failing test for `env import` parsing .env file and setting variables in tests/env-set.test.js
- [x] T014 [P] [US1] Write failing test for name validation rejecting invalid names in tests/validation.test.js

### Implementation for User Story 1

- [x] T015 [US1] Implement `listEnvVars(branch)` method in services/HeadlessService.js
- [x] T016 [US1] Implement `setEnvVar(branch, name, value)` method in services/HeadlessService.js
- [x] T017 [US1] Implement `deleteEnvVar(branch, name)` method in services/HeadlessService.js
- [x] T018 [US1] Create commands/env.js with `list`, `set`, `delete`, `import` subcommands using Commander addCommand pattern
- [x] T019 [US1] Implement .env file parsing in commands/env.js import action (split on first `=`, skip `#` and blank lines)
- [x] T020 [US1] Wire env command group into bin/index.js via addCommand()

**Checkpoint**: `kibo-headless env list/set/delete/import --branch main` all functional and tested

---

## Phase 4: User Story 5 — CLI Rename and Backward Compatibility (Priority: P1)

**Goal**: Old binary name `kibo-headless-logs` still works; existing flat commands (`runtime-logs`, `get-build-logs`, `init`, `env-template`) unchanged

**Independent Test**: Run `kibo-headless-logs runtime-logs --help` and verify it resolves. Run `kibo-headless --help` and verify all command groups listed.

### Tests for User Story 5 ⚠️

- [x] T021 [P] [US5] Write failing test verifying package.json has both bin entries in tests/cli-compat.test.js
- [x] T022 [P] [US5] Write failing test verifying existing commands (`runtime-logs`, `get-build-logs`) still registered in tests/cli-compat.test.js

### Implementation for User Story 5

- [x] T023 [US5] Verify existing commands (`runtime-logs`, `get-build-logs`, `init`, `env-template`) remain registered unchanged in bin/index.js
- [x] T024 [US5] Set Commander program name dynamically from `process.argv[1]` for accurate help text in bin/index.js

**Checkpoint**: Both `kibo-headless` and `kibo-headless-logs` binaries work; all existing commands unchanged

---

## Phase 5: User Story 2 — Developer Manages Secrets via CLI (Priority: P2)

**Goal**: Developers can list secret names, set secrets (with stdin support), and delete secrets

**Independent Test**: `kibo-headless secrets set --branch main --name DB_CONN --value "test"`, then `kibo-headless secrets list --branch main` shows name only (no value)

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T025 [P] [US2] Write failing test for `secrets list` outputting names with timestamps (never values) in tests/secrets.test.js
- [x] T026 [P] [US2] Write failing test for `secrets set` with --value flag (includes stderr warning) in tests/secrets.test.js
- [x] T027 [P] [US2] Write failing test for `secrets set --value-stdin` reading from pipe in tests/secrets.test.js
- [x] T028 [P] [US2] Write failing test for `secrets delete` in tests/secrets.test.js

### Implementation for User Story 2

- [x] T029 [US2] Implement `listSecrets(branch)` method in services/HeadlessService.js
- [x] T030 [US2] Implement `setSecret(branch, name, value)` method in services/HeadlessService.js
- [x] T031 [US2] Implement `deleteSecret(branch, name)` method in services/HeadlessService.js
- [x] T032 [US2] Implement stdin reading helper using process.stdin.isTTY + async iterable pattern in util/output.js
- [x] T033 [US2] Create commands/secrets.js with `list`, `set`, `delete` subcommands (--value-stdin support, stderr shell history warning)
- [x] T034 [US2] Wire secrets command group into bin/index.js via addCommand()

**Checkpoint**: `kibo-headless secrets list/set/delete --branch main` all functional; values never echoed in list; shell history warning on --value

---

## Phase 6: User Story 3 — Developer Triggers a Rebuild After Config Changes (Priority: P2)

**Goal**: Developers can trigger an Amplify rebuild and see job ID + status

**Independent Test**: `kibo-headless builds trigger --branch main` returns job ID and PENDING status

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T035 [P] [US3] Write failing test for `builds trigger` returning job ID, branch, status, start time in tests/builds.test.js
- [x] T036 [P] [US3] Write failing test for `builds trigger --json` outputting raw JSON in tests/builds.test.js

### Implementation for User Story 3

- [x] T037 [US3] Implement `triggerBuild(branch)` method in services/HeadlessService.js
- [x] T038 [US3] Create commands/builds.js with `trigger` subcommand (default + --json output)
- [x] T039 [US3] Wire builds command group into bin/index.js via addCommand()

**Checkpoint**: `kibo-headless builds trigger --branch main` returns job metadata; `--json` flag works

---

## Phase 7: User Story 4 — Account Owner Manages Headless Permissions via CLI (Priority: P3)

**Goal**: Account owners can list available permissions, show developer's permissions, grant, and revoke

**Independent Test**: `kibo-headless permissions list --developer-account-id 100` shows available permissions; grant/revoke modify assignments

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T040 [P] [US4] Write failing test for `permissions list` showing permission names and descriptions in tests/permissions.test.js
- [x] T041 [P] [US4] Write failing test for `permissions show` showing developer's assignments in tests/permissions.test.js
- [x] T042 [P] [US4] Write failing test for `permissions grant` and `permissions revoke` in tests/permissions.test.js

### Implementation for User Story 4

- [x] T043 [US4] Implement `listPermissions(developerAccountId)` method in services/HeadlessService.js (uses separate base path)
- [x] T044 [US4] Implement `showDeveloperPermissions(developerAccountId, developerId)` method in services/HeadlessService.js
- [x] T045 [US4] Implement `grantPermission(developerAccountId, developerId, permissionName)` method in services/HeadlessService.js
- [x] T046 [US4] Implement `revokePermission(developerAccountId, developerId, permissionName)` method in services/HeadlessService.js
- [x] T047 [US4] Create commands/permissions.js with `list`, `show`, `grant`, `revoke` subcommands (--developer-account-id required)
- [x] T048 [US4] Wire permissions command group into bin/index.js via addCommand()

**Checkpoint**: All permissions commands functional; separate base path (`platform/appdev/developer-accounts/{id}/`) used correctly

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, error handling consistency, final validation

- [x] T049 [P] Update README.md with new command documentation (env, secrets, builds, permissions, logs aliases)
- [x] T050 [P] Add --json flag support to all commands that don't have it yet (ensure consistency per FR-021)
- [x] T051 Validate all error paths: 403 → permission message, 404 → not found, 502 → diagnostic error, network → connection error with URL
- [x] T052 Run quickstart.md validation — verify all example commands match implementation
- [x] T053 Run full test suite `node --test` and confirm all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 / env (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 5 / rename (Phase 4)**: Depends on Setup (Phase 1) — can run in parallel with Phase 3
- **User Story 2 / secrets (Phase 5)**: Depends on Foundational (Phase 2) — can run in parallel with Phase 3
- **User Story 3 / builds (Phase 6)**: Depends on Foundational (Phase 2) — can run in parallel with Phase 3
- **User Story 4 / permissions (Phase 7)**: Depends on Foundational (Phase 2) — can run in parallel with Phase 3
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Phase 2 — no other story dependencies
- **User Story 5 (P1)**: Depends only on Phase 1 — independent of other stories
- **User Story 2 (P2)**: Depends only on Phase 2 — reuses validation from US1 but independently testable
- **User Story 3 (P2)**: Depends only on Phase 2 — fully independent
- **User Story 4 (P3)**: Depends only on Phase 2 — fully independent (different API base path)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Service methods before command files
- Command file before wiring into bin/index.js
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004, T005 can all run in parallel (Phase 1, different files)
- T010–T014 can all run in parallel (all test files for US1)
- T021, T022 can run in parallel with US1 tasks (different story, different files)
- T025–T028 can all run in parallel (all test files for US2)
- T035–T036 can run in parallel (US3 tests)
- T040–T042 can run in parallel (US4 tests)
- T049, T050 can run in parallel (Phase 8, different files)
- Once Phase 2 completes, Phases 3–7 can ALL start in parallel (if team capacity allows)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
T010: "env list test in tests/env-list.test.js"
T011: "env set test in tests/env-set.test.js"
T012: "env delete test in tests/env-set.test.js"
T013: "env import test in tests/env-set.test.js"
T014: "validation test in tests/validation.test.js"

# After tests exist and fail, implement service methods:
T015: "listEnvVars in services/HeadlessService.js"
T016: "setEnvVar in services/HeadlessService.js"
T017: "deleteEnvVar in services/HeadlessService.js"

# Then command + wiring:
T018: "commands/env.js"
T019: ".env parsing in commands/env.js"
T020: "Wire into bin/index.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 5 Only)

1. Complete Phase 1: Setup (package rename, test infra, shared utils)
2. Complete Phase 2: Foundational (HeadlessService + CLI restructure)
3. Complete Phase 3: User Story 1 — env commands
4. Complete Phase 4: User Story 5 — backward compat validation
5. **STOP and VALIDATE**: `kibo-headless env list --branch main` works; `kibo-headless-logs` still works
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (env) + US5 (rename) → Test independently → **Deploy MVP**
3. Add US2 (secrets) → Test independently → Deploy
4. Add US3 (builds) → Test independently → Deploy
5. Add US4 (permissions) → Test independently → Deploy
6. Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (env commands)
   - Developer B: User Story 2 (secrets)
   - Developer C: User Story 3 (builds) + User Story 4 (permissions)
3. Stories complete and integrate independently — all use HeadlessService

---

## Notes

- No pagination logic needed — API returns all items in single response
- `node:test` is built-in Node 18+ — zero dev dependencies for testing
- HeadlessService follows exact same pattern as existing LogService (authenticated fetch with headers)
- Permissions commands use different API base path: `platform/appdev/developer-accounts/{developerAccountId}/`
- Secret values never appear in CLI output (list shows names only)
