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
                'Authorization': `Bearer ${this.authTicket.access_token}`,
                'x-vol-tenant': this._tenant,
                'x-vol-site': this._site
            }
        }
        const url = `https://${this._homeHost}/api/platform/appdev/headless-app/logs/runtime?${paramStr}`
        const response = await fetch(url,requestOpt)
        return response
    }
    async fetchRuntimeLogs(prefix=null, maxentries=null, cutoff=null, maxResults=500, nextToken=null, results=[]) {
        const response = await this.fetchRuntimeLogBatch(prefix, maxResults, nextToken)
        if(!response.ok){
            console.error(`error fetching logs, status: ${response.status} prefix: ${prefix} maxResults: ${maxResults} nextToken: ${nextToken}`)
            const respTxt = await response.text()
            throw new Error(respTxt)
        }
        const logResponse = await response.json()

        // If we have a cutoff time, take that into consideration
        if (cutoff == null) {
            results.push(...logResponse.logs)
        } else {
            let shouldContinue = false
            for (const log of logResponse.logs) {

                // The key looks like this:  "d1gz5i035kxk7q/2024/12/10/00/client-d1gz5i035kxk7q-logs-delivery-2-2024-12-10-00-09-32-994cd7b9-459c-43ed-8065-c88e266042ed",
                // We can lop off the end, since the date format and UUID are constant, and then compare to the cutoff

                if (log.key.substring(log.key.length - 56) <= cutoff) {
                    shouldContinue = true
                    results.push(log)
                }
            }
            if (!shouldContinue) {
                return results
            }
        }

        // Stop if user has suppied maxentries and we have more logs than that
        if (maxentries && results.length > maxentries) {
            return results.slice(0, maxentries)
        }
        
        if(logResponse.isTruncated){
            return this.fetchRuntimeLogs(prefix, maxentries, cutoff, maxResults, logResponse.nextToken, results)
        }
        return results
    }
    async fetchBuildJobs(branch){
        await this._authClient.getAccessToken()
        const requestOpt = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authTicket.access_token}`,
                'x-vol-tenant': this._tenant,
                'x-vol-site': this._site
            }
        }
        const url = `https://${this._homeHost}/api/platform/appdev/headless-app/builds/${branch}`
        const response = await fetch(url,requestOpt)
        const json = await response.json()
        return json
    }
    async fetchBuildJobLog(branch, jobId){
        await this._authClient.getAccessToken()
        const requestOpt = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.authTicket.access_token}`,
                'x-vol-tenant': this._tenant,
                'x-vol-site': this._site
            }
        }
        const url = `https://${this._homeHost}/api/platform/appdev/headless-app/builds/${branch}/logs/${jobId}`
        const response = await fetch(url,requestOpt)
        const json = await response.json()
        return json
    }
}

