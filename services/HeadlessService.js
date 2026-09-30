import { APIAuthClient } from '@kibocommerce/sdk-authentication';

export default class HeadlessService {
  _authClient;
  _homeHost;
  _tenant;
  _site;
  authTicket = null;

  constructor(options) {
    const { clientId, clientSecret: sharedSecret, homeHost, tenant, site } = options;
    this._homeHost = homeHost;
    this._tenant = tenant;
    this._site = site;

    const memCache = {
      getAuthTicket: async () => this.authTicket,
      setAuthTicket: (kiboAuthTicket) => { this.authTicket = kiboAuthTicket; },
    };
    this._authClient = new APIAuthClient({ clientId, sharedSecret, authHost: homeHost }, fetch, memCache);
  }

  async _request(method, path, body = undefined) {
    await this._authClient.getAccessToken();
    const url = `https://${this._homeHost}/api/platform/appdev/${path}`;
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${this.authTicket.access_token}`,
        'x-vol-tenant': this._tenant,
        'x-vol-site': this._site,
        'Content-Type': 'application/json',
      },
    };
    if (body !== undefined) {
      opts.body = JSON.stringify(body);
    }
    const response = await fetch(url, opts);
    if (!response.ok) {
      let errData;
      try { errData = await response.json(); } catch { errData = { message: `HTTP ${response.status}` }; }
      const err = new Error(errData.errorCode ? `[${errData.errorCode}]: ${errData.message}` : errData.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.errorCode = errData.errorCode;
      err.errorData = errData;
      throw err;
    }
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      const err = new Error(`Invalid JSON response from API (status ${response.status}). Body starts with: ${text.substring(0, 100)}`);
      err.status = response.status;
      throw err;
    }
  }

  // --- Environment Variables ---

  async listEnvVars(branch) {
    return this._request('GET', `headless-app/env/${encodeURIComponent(branch)}`);
  }

  async setEnvVar(branch, name, value) {
    return this._request('PUT', `headless-app/env/${encodeURIComponent(branch)}`, { name, value });
  }

  async deleteEnvVar(branch, name) {
    return this._request('DELETE', `headless-app/env/${encodeURIComponent(branch)}/${encodeURIComponent(name)}`);
  }

  // --- Secrets ---

  async listSecrets(branch) {
    return this._request('GET', `headless-app/secrets/${encodeURIComponent(branch)}`);
  }

  async setSecret(branch, name, value) {
    return this._request('PUT', `headless-app/secrets/${encodeURIComponent(branch)}`, { name, value });
  }

  async deleteSecret(branch, name) {
    return this._request('DELETE', `headless-app/secrets/${encodeURIComponent(branch)}/${encodeURIComponent(name)}`);
  }

  // --- Builds ---

  async triggerBuild(branch) {
    return this._request('POST', `headless-app/builds/${encodeURIComponent(branch)}/trigger`);
  }
}
