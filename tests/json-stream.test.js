import { describe, it } from 'node:test';
import assert from 'node:assert';
import { splitConcatenatedJson } from '../util/json-stream.js';

describe('splitConcatenatedJson', () => {
  it('splits adjacent objects with no separator', () => {
    const input = '{"a":1}{"b":2}{"c":3}';
    const chunks = splitConcatenatedJson(input);
    assert.strictEqual(chunks.length, 3);
    assert.deepStrictEqual(chunks.map(c => JSON.parse(c)), [{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('does not split on }{ inside a string value (the jq crash case)', () => {
    const input = '{"message":"oops }{ not a boundary"}{"message":"fine"}';
    const chunks = splitConcatenatedJson(input);
    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(JSON.parse(chunks[0]).message, 'oops }{ not a boundary');
  });

  it('tolerates whitespace and newlines between objects', () => {
    const input = '{"a":1}\n{"b":2}\r\n  {"c":3}';
    const chunks = splitConcatenatedJson(input);
    assert.strictEqual(chunks.length, 3);
  });

  it('handles nested objects and escaped quotes', () => {
    const input = '{"outer":{"inner":"x"},"s":"a\\"}b"}{"d":4}';
    const chunks = splitConcatenatedJson(input);
    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(JSON.parse(chunks[0]).s, 'a"}b');
  });

  it('skips a malformed trailing fragment instead of emitting it', () => {
    const input = '{"a":1}{"b":"unterminated';
    const chunks = splitConcatenatedJson(input);
    assert.strictEqual(chunks.length, 1);
  });

  it('returns empty array for empty input', () => {
    assert.deepStrictEqual(splitConcatenatedJson(''), []);
  });
});
