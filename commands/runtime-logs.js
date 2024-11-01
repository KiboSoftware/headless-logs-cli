import zlib from 'zlib'
import { Readable } from "stream";
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import jq from 'node-jq'
import LogService from '../services/LogService.js';
import { splitGzipAndExtractContents } from '../util/decompression.js';

function splitLogStreams(content) {
    const chunks = content.split('}{')
    return chunks.map((chunk, idx) => {
        if (idx === 0) {
            return chunk = chunk + '}'
        }
        if (idx === chunks.length - 1) {
            return chunk = '{' + chunk
        }
        return chunk = '{' + chunk + '}'
    })
}
async function extractStandardGzip(log, logContents) {
    const response = await fetch(log.logUrl);
    if (!response.ok) {
        console.error(`Failed to fetch ${log.logUrl}`);
        return;
    }
    const gunzip = zlib.createGunzip();
    const decompressedStream = Readable.fromWeb(response.body).pipe(gunzip)
    const chunks = []
    for await (const chunk of decompressedStream) {
        chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString()
    logContents.push(...splitLogStreams(content))
}

// Function to fetch, unzip, and combine log files
async function extractLogContent(logs = []) {
    // Sort logs by lastModified datetime
    logs.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));
    const logContents = [];
    for (const log of logs) {
        try {
            await extractStandardGzip(log, logContents)
        } catch (error) {
            const response = await fetch(log.logUrl);
            if (!response.ok) {
                console.error(`Failed to fetch ${log.logUrl}`);
                continue;
            }
            const responseData = await response.arrayBuffer()
            await splitGzipAndExtractContents(responseData, logContents)
        }
        if ((logContents.length % 200) == 0) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(Math.floor(((logContents.length / logs.length)) * 100) + '%');
        }
    }
    return logContents
}

async function formatLogs(logContents = [], batchSize = 200) {
    const filter = '[.[] | . as $parent | .logEvents[] | del(.id) | . + { branch: ($parent.logStream | split("/") | .[0]) }]';
    const parseStructuredFilter = '[.[] | . + (try (.message | fromjson) // {message: .message}) // .]';
    const options = { input: 'string', output: 'compact' };
    const results = [];

    for (let i = 0; i < logContents.length; i += batchSize) {
        // Create a batch by slicing the input array
        const batch = logContents.slice(i, i + batchSize);

        // Join the batch into a JSON array format
        const batchInput = `[${batch.join(',')}]`;

        // Process the batch in one call to jq
        const filteredBatch = await jq.run(filter, batchInput, options);
        const parsedBatch = await jq.run(parseStructuredFilter, filteredBatch, options);

        // Parse the JSON output from jq and add it to results
        results.push(...JSON.parse(parsedBatch));
        if ((results.length % batchSize) == 0) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(Math.floor(((i / logContents.length)) * 100) + '%');
        }
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    return results.map(log => JSON.stringify(log)).join('\n');
}

function getOutFilePath(options) {
    if (options.output) {
        const fileName = options.prefix ? `${options.prefix}_runtimelogs.ndjson` : 'runtimelogs.ndjson'
        return resolve(options.output, fileName)
    }
    return resolve(options.outputFile)
}
export default async function exportRuntimeLogs(options) {
    try {
        const outputFile = getOutFilePath(options)
        const { prefix } = options
        console.log('fetching log entries...')
        const logService = new LogService(options)
        const logs = await logService.fetchRuntimeLogs(prefix)
        if (!logs.length) {
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