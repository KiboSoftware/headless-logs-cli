import HeadlessService from '../services/HeadlessService.js';

export function getService(cmd) {
  const opts = cmd.optsWithGlobals ? cmd.optsWithGlobals() : cmd.opts();
  const { clientId, clientSecret, tenant, site } = opts;
  if (!clientId || !clientSecret) {
    throw new Error('Missing credentials: --client-id and --client-secret are required (or set KIBO_CLIENT_ID / KIBO_CLIENT_SECRET env vars)');
  }
  if (!tenant || !site) {
    throw new Error('Missing config: --tenant and --site are required (or set KIBO_TENANT / KIBO_SITE env vars)');
  }
  return new HeadlessService({
    clientId,
    clientSecret,
    homeHost: opts.homeHost || 'home.mozu.com',
    tenant,
    site,
  });
}
