import zlib from 'zlib'
import { Readable } from "stream";
import { writeFile, rm } from 'fs/promises';
import { createWriteStream } from 'fs';
import { resolve } from 'path';
import jq from 'node-jq'
import LogService from '../services/LogService.js';
import { splitGzipAndExtractContents } from '../util/decompression.js';

function writeToStream(stream, data) {
    return new Promise((resolve, reject) => {
        stream.write(data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

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
async function extractStandardGzip(log, logContents=[]) {
    const response = await fetch(log.logUrl);
    if (!response.ok) {
        console.error(`Failed to fetch ${log.logUrl}`);
        return logContents;
    }
    const gunzip = zlib.createGunzip();
    const decompressedStream = Readable.fromWeb(response.body).pipe(gunzip)
    const chunks = []
    for await (const chunk of decompressedStream) {
        chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString()
    logContents.push(...splitLogStreams(content))
    return logContents
}

// Function to fetch, unzip, and combine log files
async function extractLogContent(logs, writeStream, batchSize=4000) {
    // Sort logs by lastModified datetime
    logs.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));
    let logBuffer = [], totalWritten = 0;
    for(let i = 0; i < logs.length; i++) {
        let log = logs[i];
        try {
            await extractStandardGzip(log, logBuffer)
        } catch (error) {
            const response = await fetch(log.logUrl);
            if (!response.ok) {
                console.error(`Failed to fetch ${log.logUrl}`);
                continue;
            }
            const responseData = await response.arrayBuffer()
            await splitGzipAndExtractContents(responseData, logBuffer)
        }
        if (logBuffer.length > batchSize) {
            
            const appendLogBatch = await formatLogs(logBuffer)
            await writeToStream(writeStream, appendLogBatch)
            totalWritten += logBuffer.length
            logBuffer = []
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`total log events written: ${totalWritten}, ${Math.floor(((i / logs.length)) * 100)}% complete`);
        }
    }
    if (logBuffer.length > 0) {
        const appendLogBatch = await formatLogs(logBuffer)
        await writeToStream(writeStream, appendLogBatch)
        logBuffer = []
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`total log events written: ${totalWritten}, 100% complete\n`);
    return
}

async function formatLogs(logContents = [], jqBatchSize = 200) {
    const filter = '[.[] | . as $parent | .logEvents[] | del(.id) | . + { branch: ($parent.logStream | split("/") | .[0]) }]';
    const parseStructuredFilter = '[.[] | . + (try (.message | fromjson) // {message: .message}) // .]';
    const options = { input: 'string', output: 'compact' };
    const results = [];

    for (let i = 0; i < logContents.length; i += jqBatchSize) {
        // Create a batch by slicing the input array
        const batch = logContents.slice(i, i + jqBatchSize);

        // Join the batch into a JSON array format
        const batchInput = `[${batch.join(',')}]`;

        // Process the batch in one call to jq
        const filteredBatch = await jq.run(filter, batchInput, options);
        const parsedBatch = await jq.run(parseStructuredFilter, filteredBatch, options);

        // Parse the JSON output from jq and add it to results
        results.push(...JSON.parse(parsedBatch));
    }
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
        console.log('fetching log groups...')
        const logService = new LogService(options)
        const logs = await logService.fetchRuntimeLogs(prefix)
        if (!logs.length) {
            console.log('no logs found')
            return
        }
        
        console.log(`found ${logs.length} log stream groups`)
        try {
            await rm(outputFile, { force: true, recursive: true });
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
        await writeFile(outputFile, '', 'utf8');
        console.log(`creating output write stream, file: ${outputFile}`)
        const writeStream = createWriteStream(outputFile, { flags: 'a' });
        console.log(`extracting log data...`)
        await extractLogContent(logs, writeStream);
        writeStream.end(() => console.log('All logs written'));
        // const combinedLogNDJson = await formatLogs(logContents)
        // await writeFile(outputFile, combinedLogNDJson, 'utf8')
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}