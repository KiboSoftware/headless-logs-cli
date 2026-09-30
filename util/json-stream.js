/**
 * Split a buffer of concatenated JSON objects ({...}{...}{...}) into individual
 * JSON object strings. String-aware: braces inside string values and escaped
 * quotes do not affect depth tracking, so a message containing `}{` does not
 * split the object. Whitespace/newlines between objects are tolerated.
 *
 * Each emitted chunk is validated with JSON.parse; unparseable fragments
 * (e.g. a truncated tail) are skipped with a stderr warning rather than
 * poisoning downstream jq batches.
 *
 * @param {string} content
 * @returns {string[]} array of valid JSON object strings
 */
export function splitConcatenatedJson(content) {
    const chunks = [];
    let depth = 0;
    let inString = false;
    let escaped = false;
    let start = -1;

    for (let i = 0; i < content.length; i++) {
        const c = content[i];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (c === '\\') {
                escaped = true;
            } else if (c === '"') {
                inString = false;
            }
            continue;
        }
        if (c === '"') {
            inString = true;
        } else if (c === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (c === '}') {
            if (depth > 0) {
                depth--;
                if (depth === 0 && start >= 0) {
                    const chunk = content.slice(start, i + 1);
                    try {
                        JSON.parse(chunk);
                        chunks.push(chunk);
                    } catch {
                        process.stderr.write(`Warning: skipped malformed JSON fragment (${chunk.length} chars)\n`);
                    }
                    start = -1;
                }
            }
        }
    }
    return chunks;
}
