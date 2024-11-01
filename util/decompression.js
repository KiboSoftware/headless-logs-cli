import zlib from 'zlib';

// Byte sequence that indicates the start of a gzip file
const GZIP_MAGIC = Buffer.from([0x1f, 0x8b]);
export function splitGzipAndExtractContents(incomingBuffer, logContents=[]) {
    const data = Buffer.from(incomingBuffer);
    // Find all positions where gzip files start
    const positions = [];
    let pos = data.indexOf(GZIP_MAGIC);
    while (pos !== -1) {
        positions.push(pos);
        pos = data.indexOf(GZIP_MAGIC, pos + 1);
    }
    // Write each split segment to a new file
    positions.forEach((start, i) => {
        const end = positions[i + 1];
        const partData = data.subarray(start, end - 1);
        try {
            const decompressedData = zlib.gunzipSync(partData);
            const stringData = decompressedData.toString('utf-8');
            logContents.push(stringData);
        } catch (err) { }
    });
    return logContents;
}