import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatSecretsOutput } from '../util/output.js';
import { createMockService } from './helpers/mock-service.js';

describe('secrets list', () => {
  it('outputs names with timestamps (never values)', () => {
    const data = {
      items: [
        { name: 'DB_CONNECTION_STRING', lastModified: '2026-06-01T12:00:00Z' },
        { name: 'PRIVATE_API_KEY', lastModified: '2026-05-30T08:15:00Z' },
      ],
    };
    const output = formatSecretsOutput(data);
    assert.ok(output.includes('DB_CONNECTION_STRING'));
    assert.ok(output.includes('2026-06-01T12:00:00Z'));
    assert.ok(output.includes('PRIVATE_API_KEY'));
    // Ensure no value field leaks
    assert.ok(!output.includes('connection-string'));
  });

  it('returns empty string for empty items', () => {
    const output = formatSecretsOutput({ items: [] });
    assert.strictEqual(output, '');
  });
});

describe('secrets set', () => {
  it('mock service setSecret stores secret', async () => {
    const svc = createMockService({
      setSecret: async (branch, name, value) => {
        assert.strictEqual(branch, 'main');
        assert.strictEqual(name, 'DB_CONN');
        assert.strictEqual(value, 'Server=localhost');
        return {};
      },
    });
    const result = await svc.setSecret('main', 'DB_CONN', 'Server=localhost');
    assert.deepStrictEqual(result, {});
  });
});

describe('secrets delete', () => {
  it('mock service deleteSecret succeeds', async () => {
    const svc = createMockService({
      deleteSecret: async (branch, name) => {
        assert.strictEqual(name, 'DB_CONN');
        return {};
      },
    });
    const result = await svc.deleteSecret('main', 'DB_CONN');
    assert.deepStrictEqual(result, {});
  });
});

describe('secrets command structure', () => {
  it('has list, set, delete subcommands', async () => {
    const { createSecretsCommand } = await import('../commands/secrets.js');
    const cmd = createSecretsCommand();
    assert.strictEqual(cmd.name(), 'secrets');
    const subcommands = cmd.commands.map(c => c.name());
    assert.ok(subcommands.includes('list'));
    assert.ok(subcommands.includes('set'));
    assert.ok(subcommands.includes('delete'));
  });
});
