import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatError } from '../util/output.js';

describe('formatError', () => {
  it('formats error with errorCode and message', () => {
    const err = { errorCode: 'HEADLESS_NOT_FOUND', message: 'Branch not found' };
    assert.strictEqual(formatError(err), 'Error [HEADLESS_NOT_FOUND]: Branch not found');
  });

  it('formats error with message only', () => {
    const err = { message: 'Something went wrong' };
    assert.strictEqual(formatError(err), 'Error: Something went wrong');
  });

  it('formats unknown error when no message or code', () => {
    const err = {};
    assert.strictEqual(formatError(err), 'Error: An unknown error occurred');
  });

  it('prefers errorCode+message over message-only', () => {
    const err = { errorCode: 'ERR_001', message: 'detail' };
    const output = formatError(err);
    assert.ok(output.includes('ERR_001'));
    assert.ok(output.includes('detail'));
  });
});
