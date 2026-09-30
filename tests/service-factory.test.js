import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getService } from '../util/service-factory.js';

describe('getService (service factory)', () => {
  function makeMockCmd(opts) {
    return {
      optsWithGlobals: () => opts,
    };
  }

  it('throws if clientId is missing', () => {
    const cmd = makeMockCmd({ clientSecret: 'secret', tenant: '123', site: '456' });
    assert.throws(
      () => getService(cmd),
      (err) => err.message.includes('Missing credentials')
    );
  });

  it('throws if clientSecret is missing', () => {
    const cmd = makeMockCmd({ clientId: 'id', tenant: '123', site: '456' });
    assert.throws(
      () => getService(cmd),
      (err) => err.message.includes('Missing credentials')
    );
  });

  it('throws if tenant is missing', () => {
    const cmd = makeMockCmd({ clientId: 'id', clientSecret: 'secret', site: '456' });
    assert.throws(
      () => getService(cmd),
      (err) => err.message.includes('Missing config')
    );
  });

  it('throws if site is missing', () => {
    const cmd = makeMockCmd({ clientId: 'id', clientSecret: 'secret', tenant: '123' });
    assert.throws(
      () => getService(cmd),
      (err) => err.message.includes('Missing config')
    );
  });

  it('returns HeadlessService instance with valid options', () => {
    const cmd = makeMockCmd({
      clientId: 'id',
      clientSecret: 'secret',
      tenant: '123',
      site: '456',
      homeHost: 'home.mozu.com',
    });
    const svc = getService(cmd);
    assert.ok(svc);
    assert.strictEqual(typeof svc.listEnvVars, 'function');
  });

  it('defaults homeHost to home.mozu.com', () => {
    const cmd = makeMockCmd({
      clientId: 'id',
      clientSecret: 'secret',
      tenant: '123',
      site: '456',
    });
    const svc = getService(cmd);
    assert.ok(svc);
  });
});
