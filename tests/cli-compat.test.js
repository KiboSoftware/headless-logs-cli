import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('CLI backward compatibility', () => {
  it('package.json has both bin entries', () => {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf-8'));
    assert.ok(pkg.bin['kibo-headless'], 'Missing kibo-headless bin entry');
    assert.ok(pkg.bin['kibo-headless-logs'], 'Missing kibo-headless-logs bin entry');
    assert.strictEqual(pkg.bin['kibo-headless'], pkg.bin['kibo-headless-logs']);
  });

  it('bin/index.js has a node shebang so the bin shim runs under node', () => {
    // Without it, `kibo-headless ...` executes as a shell script and fails with
    // "import: command not found". Regression test for the missing-shebang bug.
    const src = readFileSync(resolve(import.meta.dirname, '../bin/index.js'), 'utf-8');
    assert.ok(src.startsWith('#!/usr/bin/env node'), 'bin/index.js must start with #!/usr/bin/env node');
  });

  it('existing commands are still registered', async () => {
    // We can verify by importing and checking Commander structure
    const { execSync } = await import('node:child_process');
    const helpOutput = execSync('node bin/index.js --help', { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf-8' });
    assert.ok(helpOutput.includes('runtime-logs'), 'runtime-logs command missing');
    assert.ok(helpOutput.includes('get-build-logs'), 'get-build-logs command missing');
    assert.ok(helpOutput.includes('init'), 'init command missing');
    assert.ok(helpOutput.includes('env-template'), 'env-template command missing');
  });

  it('new command groups are registered', async () => {
    const { execSync } = await import('node:child_process');
    const helpOutput = execSync('node bin/index.js --help', { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf-8' });
    assert.ok(helpOutput.includes('env'), 'env command group missing');
    assert.ok(helpOutput.includes('secrets'), 'secrets command group missing');
    assert.ok(helpOutput.includes('builds'), 'builds command group missing');
    assert.ok(helpOutput.includes('logs'), 'logs command group missing');
  });
});
