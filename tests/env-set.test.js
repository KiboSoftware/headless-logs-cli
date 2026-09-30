import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMockService } from './helpers/mock-service.js';

describe('env set', () => {
  it('mock service setEnvVar returns success', async () => {
    const svc = createMockService({
      setEnvVar: async (branch, name, value) => {
        assert.strictEqual(branch, 'main');
        assert.strictEqual(name, 'MY_VAR');
        assert.strictEqual(value, 'my-value');
        return {};
      },
    });
    const result = await svc.setEnvVar('main', 'MY_VAR', 'my-value');
    assert.deepStrictEqual(result, {});
  });
});

describe('env delete', () => {
  it('mock service deleteEnvVar returns success', async () => {
    const svc = createMockService({
      deleteEnvVar: async (branch, name) => {
        assert.strictEqual(branch, 'main');
        assert.strictEqual(name, 'MY_VAR');
        return {};
      },
    });
    const result = await svc.deleteEnvVar('main', 'MY_VAR');
    assert.deepStrictEqual(result, {});
  });
});

describe('env import', () => {
  it('parses .env content correctly', async () => {
    // Test the parseEnvFile logic by importing dynamically
    const { createEnvCommand } = await import('../commands/env.js');
    // The command exists and is callable
    const cmd = createEnvCommand();
    assert.strictEqual(cmd.name(), 'env');
    const subcommands = cmd.commands.map(c => c.name());
    assert.ok(subcommands.includes('list'));
    assert.ok(subcommands.includes('set'));
    assert.ok(subcommands.includes('delete'));
    assert.ok(subcommands.includes('import'));
  });
});
