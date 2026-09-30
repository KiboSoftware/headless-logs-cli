import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { formatEnvOutput } from '../util/output.js';

describe('env list', () => {
  it('outputs NAME=VALUE format for each variable', () => {
    const data = {
      items: [
        { name: 'API_KEY', value: 'sk-123abc', lastModified: '2026-06-01T12:00:00Z' },
        { name: 'FEATURE_FLAG', value: 'true', lastModified: '2026-06-01T12:00:00Z' },
        { name: 'NEXT_PUBLIC_SITE', value: 'mystore', lastModified: '2026-06-01T12:00:00Z' },
      ],
    };
    const output = formatEnvOutput(data);
    assert.strictEqual(output, 'API_KEY=sk-123abc\nFEATURE_FLAG=true\nNEXT_PUBLIC_SITE=mystore');
  });

  it('returns empty string for empty items', () => {
    const output = formatEnvOutput({ items: [] });
    assert.strictEqual(output, '');
  });

  it('handles missing items gracefully', () => {
    const output = formatEnvOutput({});
    assert.strictEqual(output, '');
  });
});
