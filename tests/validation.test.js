import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateName, validateValue } from '../util/validation.js';

describe('validateName', () => {
  it('accepts valid names', () => {
    assert.deepStrictEqual(validateName('API_KEY'), { valid: true });
    assert.deepStrictEqual(validateName('_private'), { valid: true });
    assert.deepStrictEqual(validateName('myVar123'), { valid: true });
    assert.deepStrictEqual(validateName('A'), { valid: true });
  });

  it('rejects names starting with a number', () => {
    const result = validateName('123bad');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('123bad'));
  });

  it('rejects names with special characters', () => {
    assert.strictEqual(validateName('my-var').valid, false);
    assert.strictEqual(validateName('my.var').valid, false);
    assert.strictEqual(validateName('my var').valid, false);
    assert.strictEqual(validateName('my$var').valid, false);
  });

  it('rejects empty or null names', () => {
    assert.strictEqual(validateName('').valid, false);
    assert.strictEqual(validateName(null).valid, false);
    assert.strictEqual(validateName(undefined).valid, false);
  });
});

describe('validateValue', () => {
  it('accepts values within length limit', () => {
    assert.deepStrictEqual(validateValue('short value'), { valid: true });
    assert.deepStrictEqual(validateValue('x'.repeat(4096)), { valid: true });
  });

  it('rejects values exceeding 4096 chars', () => {
    const result = validateValue('x'.repeat(4097));
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('4096'));
  });

  it('accepts empty/null values', () => {
    assert.deepStrictEqual(validateValue(''), { valid: true });
    assert.deepStrictEqual(validateValue(null), { valid: true });
  });
});
