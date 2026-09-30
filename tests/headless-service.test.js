import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('HeadlessService', () => {
  let HeadlessService;

  beforeEach(async () => {
    // Dynamic import to allow mocking
    const mod = await import('../services/HeadlessService.js');
    HeadlessService = mod.default;
  });

  it('constructs with auth options and creates auth client', () => {
    const svc = new HeadlessService({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      homeHost: 'home.mozu.com',
      tenant: '12345',
      site: '67890',
    });
    assert.ok(svc);
  });

  it('makes authenticated GET request with correct headers', async () => {
    const mockResponse = { ok: true, text: async () => JSON.stringify({ items: [{ name: 'FOO', value: 'bar' }] }) };

    const svc = new HeadlessService({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      homeHost: 'home.mozu.com',
      tenant: '12345',
      site: '67890',
    });

    // Override internals to avoid real auth/fetch
    svc.authTicket = { access_token: 'mock-token' };
    svc._authClient = { getAccessToken: async () => {} };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => {
      assert.ok(url.includes('/api/platform/appdev/headless-app/'));
      assert.strictEqual(opts.headers['Authorization'], 'Bearer mock-token');
      assert.strictEqual(opts.headers['x-vol-tenant'], '12345');
      assert.strictEqual(opts.headers['x-vol-site'], '67890');
      return mockResponse;
    };

    try {
      const result = await svc.listEnvVars('main');
      assert.deepStrictEqual(result, { items: [{ name: 'FOO', value: 'bar' }] });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // PUT /env/{branch} and PUT /secrets/{branch} take { name, value } in the body —
  // the name is NOT part of the route. Guards against regressing to the wrong wire shape.
  const putCases = [
    { method: 'setEnvVar', path: 'headless-app/env/main' },
    { method: 'setSecret', path: 'headless-app/secrets/main' },
  ];
  for (const { method, path } of putCases) {
    it(`${method} sends PUT to branch-scoped route with { name, value } body`, async () => {
      const svc = new HeadlessService({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        homeHost: 'home.mozu.com',
        tenant: '12345',
        site: '67890',
      });
      svc.authTicket = { access_token: 'mock-token' };
      svc._authClient = { getAccessToken: async () => {} };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url, opts) => {
        assert.strictEqual(opts.method, 'PUT');
        assert.ok(url.endsWith(`/api/platform/appdev/${path}`), `unexpected URL: ${url}`);
        assert.deepStrictEqual(JSON.parse(opts.body), { name: 'MY_KEY', value: 's3cret' });
        return { ok: true, text: async () => '{}' };
      };

      try {
        await svc[method]('main', 'MY_KEY', 's3cret');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  }

  it('throws formatted error on non-ok response', async () => {
    const svc = new HeadlessService({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      homeHost: 'home.mozu.com',
      tenant: '12345',
      site: '67890',
    });

    svc.authTicket = { access_token: 'mock-token' };
    svc._authClient = { getAccessToken: async () => {} };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      json: async () => ({ errorCode: 'HEADLESS_FORBIDDEN', message: 'Access denied' }),
    });

    try {
      await assert.rejects(
        () => svc.listEnvVars('main'),
        (err) => {
          assert.ok(err.message.includes('HEADLESS_FORBIDDEN'));
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
