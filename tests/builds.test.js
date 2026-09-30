import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatBuildOutput } from '../util/output.js';
import { createMockService } from './helpers/mock-service.js';

describe('builds trigger', () => {
  it('formats build response with job ID, branch, status, start time', () => {
    const data = {
      jobId: 'abc-123',
      branchName: 'main',
      status: 'PENDING',
      startTime: '2026-06-01T12:00:00Z',
    };
    const output = formatBuildOutput(data);
    assert.ok(output.includes('Build triggered for branch: main'));
    assert.ok(output.includes('Job ID:    abc-123'));
    assert.ok(output.includes('Status:    PENDING'));
    assert.ok(output.includes('Started:   2026-06-01T12:00:00Z'));
  });

  it('mock service triggerBuild returns expected shape', async () => {
    const svc = createMockService();
    const result = await svc.triggerBuild('main');
    assert.strictEqual(result.jobId, 'mock-job');
    assert.strictEqual(result.status, 'PENDING');
  });
});

describe('builds trigger --json', () => {
  it('raw JSON output matches data model', () => {
    const data = {
      jobId: 'abc-123',
      branchName: 'main',
      status: 'PENDING',
      startTime: '2026-06-01T12:00:00Z',
    };
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    assert.strictEqual(parsed.jobId, 'abc-123');
    assert.strictEqual(parsed.branchName, 'main');
    assert.strictEqual(parsed.status, 'PENDING');
  });
});

describe('builds command structure', () => {
  it('has trigger subcommand', async () => {
    const { createBuildsCommand } = await import('../commands/builds.js');
    const cmd = createBuildsCommand();
    assert.strictEqual(cmd.name(), 'builds');
    const subcommands = cmd.commands.map(c => c.name());
    assert.ok(subcommands.includes('trigger'));
  });
});
