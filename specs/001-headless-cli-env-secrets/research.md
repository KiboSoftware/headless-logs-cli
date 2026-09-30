# Research: Headless CLI Environment & Secrets Management

**Feature**: `001-headless-cli-env-secrets`  
**Date**: 2026-06-01

## R-001: Commander.js Subcommand Groups

**Decision**: Use `addCommand()` with nested `Command` instances for each subcommand group (`env`, `secrets`, `builds`, `permissions`, `logs`).

**Rationale**: Commander 12.x supports this natively. Avoids pitfalls of chained `.command()` which has inconsistent option inheritance. Parent options (auth, home-host) must be accessed manually via `cmd.parent.opts()` — they do NOT auto-propagate.

**Pattern**:
```javascript
import { Command } from 'commander';

const envGroup = new Command('env')
  .description('Manage environment variables');

envGroup.command('list')
  .requiredOption('-b, --branch <branch>', 'Amplify branch name')
  .action((options, cmd) => { /* ... */ });

envGroup.command('set')
  .requiredOption('-b, --branch <branch>', 'Amplify branch name')
  .requiredOption('-n, --name <name>', 'Variable name')
  .requiredOption('--value <value>', 'Variable value')
  .action((options, cmd) => { /* ... */ });

program.addCommand(envGroup);
```

**Caveat**: Auth options (`--tenant`, `--client-id`, etc.) must be added to each leaf command, not the group parent. This matches the existing pattern in `bin/index.js` where each command independently adds auth options.

**Alternatives considered**: Flat commands (`env-list`, `env-set`) — rejected because spec requires grouped structure per clarification Q5.

---

## R-002: Dual Binary Names (Backward Compatibility)

**Decision**: Use multiple `bin` entries in `package.json` pointing to the same `./bin/index.js` entrypoint.

**Pattern**:
```json
{
  "bin": {
    "kibo-headless": "./bin/index.js",
    "kibo-headless-logs": "./bin/index.js"
  }
}
```

**Rationale**: npm automatically creates symlinks for all `bin` entries on install. Both names invoke the same code. No wrapper file needed — Commander's `.name()` can be set dynamically from `process.argv[1]` for help text accuracy.

**Alternatives considered**: Separate wrapper file (`bin/kibo-headless-logs.js` importing `bin/index.js`) — rejected as unnecessary; a single entrypoint with two bin entries is simpler and the standard npm pattern.

---

## R-003: Stdin Reading for Secure Secret Input

**Decision**: Check `process.stdin.isTTY` — if falsy (piped data), read stdin as async iterable. If truthy (interactive), no stdin data available.

**Pattern**:
```javascript
async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  let data = '';
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data.trim();
}
```

**Rationale**: Node 18+ supports `for await...of` on `process.stdin` natively in ESM. The `isTTY` check prevents hanging when no pipe is connected.

**Alternatives considered**: Readline interface — rejected as overcomplicated for single-value reads. Third-party `get-stdin` package — rejected per constitution (no new dependencies without approval).

---

## R-004: Testing with node:test

**Decision**: Use Node.js built-in `node:test` module with `node:assert`. Zero dependencies.

**Pattern**:
```javascript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

describe('env list', () => {
  it('outputs NAME=VALUE format', async () => {
    // mock service, invoke command logic, assert stdout
  });
});
```

**Run**: `node --test` auto-discovers `**/*.test.{js,mjs}` files.

**Rationale**: Node 18+ includes test runner. No dev dependencies needed. Built-in `mock` module (Node 18.13+) handles function mocking. Constitution gate III requires TDD but prohibits unapproved dependencies.

**Package.json script**: `"test": "node --test"`

**Caveat**: `node:test` `mock` module may have limited features in Node 18.x vs 20.x. For this CLI, simple manual mocks (injecting a mock service into command functions) are sufficient and avoid version issues.

---

## R-005: ~~Auto-Pagination Pattern~~ (REMOVED)

**Note**: Pagination has been removed from the API. List endpoints return all items in a single response. No pagination logic needed in the CLI service layer.

---

## R-006: Permissions API Path Resolution

**Decision**: The permissions API uses a separate base path (`platform/appdev/developer-accounts/{developerAccountId}/...`) compared to the headless-app endpoints. The CLI will need the developer account ID.

**Research finding**: The existing `LogService` uses `x-vol-tenant` and `x-vol-site` headers with paths under `/api/platform/appdev/headless-app/`. The permissions endpoints in the AppDev contract use `/api/platform/appdev/developer-accounts/{developerAccountId}/...`.

**Approach**: The CLI will add a `--developer-account-id` option (with `KIBO_DEVELOPER_ACCOUNT_ID` env var) for permissions commands only. This matches the pattern of existing site-scoped options (`--tenant`, `--site`) and avoids needing an extra API call to discover the account ID.

**Rationale**: Permissions management is a P3 admin task. Admin users know their developer account ID. Adding a discovery API call would add complexity for marginal UX gain. The option with env var fallback means it can be set once in `.env` and forgotten.

**Alternatives considered**: Auto-discover via an API call — rejected because it adds a hidden network call, latency, and potential failure mode for a rarely-used admin feature.

---

## R-007: .env File Parsing for Import

**Decision**: Parse `.env` files manually using a simple line-by-line approach (split on first `=`, skip `#` comments and blank lines). Do NOT use the `dotenv` library's parsing because it has complex shell-expansion logic that could produce unexpected results.

**Pattern**:
```javascript
function parseEnvFile(content) {
  const vars = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const name = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    vars.push({ name, value });
  }
  return vars;
}
```

**Rationale**: The `dotenv` package is already in deps but its `parse()` function handles shell interpolation (`${VAR}`), multiline values, and other edge cases that may not match what the user expects when they say "upload this .env file". A simple key=value split is more predictable and the spec says "lines starting with # and empty lines MUST be ignored" — nothing about interpolation.

**Alternatives considered**: Using `dotenv.parse()` — rejected because it adds interpolation semantics that could confuse users. A `.env` file with `DB_URL=postgres://${HOST}:5432` should be uploaded literally, not expanded.
