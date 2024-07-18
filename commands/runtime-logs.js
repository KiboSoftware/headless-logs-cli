import zlib from 'zlib'
import { Readable } from "stream";
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import jq from 'node-jq'
import LogService from '../services/LogService.js';


// Function to fetch, unzip, and combine log files
async function extractLogContent(logs=[]) {
    // Sort logs by lastModified datetime
    logs.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));
    const logContents = [];
    for (const log of logs) {
        const response = await fetch(log.logUrl);
        if (!response.ok) {
            console.error(`Failed to fetch ${log.logUrl}`);
            continue;
        }
        const gunzip = zlib.createGunzip();
        const decompressedStream = Readable.fromWeb(response.body).pipe(gunzip)
        const chunks = []
        for await (const chunk of decompressedStream) {
          chunks.push(chunk);
        }
        const content = Buffer.concat(chunks).toString()
        logContents.push(content)
        if((logContents.length % 100) == 0){
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(Math.floor(((logContents.length / logs.length)) * 100) + '%');
        }
    }
    return logContents
}

async function formatLogs(logContents=[]) {
    const filter = '. as $parent | .logEvents[] | del(.id) | . + {  branch: ($parent.logStream | split("/") | .[0]) }'
    const options = { input: 'string', output: 'compact'}
    return jq.run(filter, logContents.join('\n'), options)
}


export default async function exportRuntimeLogs(options) {
    try {
        const outputFile = resolve(options.output)
        const { prefix } = options
        console.log('fetching log entries...')
        const logService = new LogService(options)
        const logs = await logService.fetchRuntimeLogs(prefix)
        if(!logs.length){
            console.log('no logs found')
            return
        }
        console.log(`found ${logs.length} log entries \n downloading/extracting data...`)
        const logContents = await extractLogContent(logs);
        console.log('formatting logs...')
        const combinedLogNDJson = await formatLogs(logContents)
        console.log(`writing log data to ${outputFile}`)
        await writeFile(outputFile, combinedLogNDJson, 'utf8')
        console.log(`Combined logs written to ${outputFile}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}