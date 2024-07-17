import { APIAuthClient } from '@kibocommerce/sdk-authentication';

export default class LogService {
    _authClient
    _homeHost
    constructor(options) {
        const { clientId, clientSecret:sharedSecret, homeHost, tenant, site } = options
        this._homeHost = homeHost
        this._tenant = tenant
        this._site = site
        this.authTicket = null
        const memCache = {
            getAuthTicket: async () => {
                return this.authTicket
            },
            setAuthTicket: (kiboAuthTicket) => {
                this.authTicket = kiboAuthTicket
            }
        }
        this._authClient = new APIAuthClient({ clientId, sharedSecret, authHost:homeHost }, fetch, memCache)
    }
    async fetchRuntimeLogBatch(prefix=null, maxResults=500, nextToken=null){
        await this._authClient.getAccessToken()
        const paramStr = `prefix=${prefix ?? ''}&maxResults=${maxResults}&nextToken=${nextToken ?? ''}`
        const requestOpt = { 
            method: 'GET', 
            headers: { 
                'Authorization': `Bearer ${this.authTicket}`,
                'x-vol-tenant': this._tenant,
                'x-vol-site': this._site
            }
        }
        const url = `https://${this._homeHost}/api/platform/appdev/headless-app/logs/runtime?${paramStr}`
        const response = await fetch(url,requestOpt)
        return response
    }
    async fetchRuntimeLogs(prefix=null, maxResults=500, nextToken=null, results=[]) {
        const response = await this.fetchRuntimeLogBatch(prefix, maxResults, nextToken)
        if(!response.ok){
            console.error(`error fetching logs, status: ${response.status} prefix: ${prefix} maxResults: ${maxResults} nextToken: ${nextToken}`)
            const respTxt = await response.text()
            throw new Error(respTxt)
        }
        const logResponse = await response.json()
        results.push(...logResponse.logs)
        if(logResponse.isTruncated){
            return this.fetchRuntimeLogs(prefix, maxResults, logResponse.nextToken, results)
        }
        return results
    }
}