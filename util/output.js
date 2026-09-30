/**
 * Format environment variables as .env file output (NAME=VALUE per line).
 * @param {{ items: Array<{name: string, value: string}> }} data
 * @returns {string}
 */
export function formatEnvOutput(data) {
  if (!data.items || data.items.length === 0) return '';
  return data.items.map(v => `${v.name}=${v.value}`).join('\n');
}

/**
 * Format secrets list output (name with timestamp comment).
 * @param {{ items: Array<{name: string, lastModified: string}> }} data
 * @returns {string}
 */
export function formatSecretsOutput(data) {
  if (!data.items || data.items.length === 0) return '';
  return data.items.map(s => `${s.name}  # ${s.lastModified}`).join('\n');
}

/**
 * Format build trigger response.
 * @param {{ jobId: string, branchName: string, status: string, startTime: string }} data
 * @returns {string}
 */
export function formatBuildOutput(data) {
  const lines = [
    `Build triggered for branch: ${data.branchName}`,
    `Job ID:    ${data.jobId}`,
    `Status:    ${data.status}`,
  ];
  if (data.startTime) {
    lines.push(`Started:   ${data.startTime}`);
  }
  return lines.join('\n');
}

/**
 * Format an API error for display.
 * @param {{ errorCode?: string, message?: string }} err
 * @returns {string}
 */
export function formatError(err) {
  if (err.errorCode && err.message) {
    return `Error [${err.errorCode}]: ${err.message}`;
  }
  if (err.message) {
    return `Error: ${err.message}`;
  }
  return 'Error: An unknown error occurred';
}

/**
 * Read value from stdin (for piped input).
 * Returns null if stdin is a TTY (no piped data).
 * Trims leading/trailing whitespace from the result.
 * Times out after 30 seconds and enforces a 4096-character size limit.
 * @returns {Promise<string|null>}
 */
export async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  const MAX_SIZE = 4096;
  const TIMEOUT_MS = 30000;
  let data = '';
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('stdin read timed out after 30 seconds')), TIMEOUT_MS)
  );
  const read = (async () => {
    for await (const chunk of process.stdin) {
      data += chunk;
      if (data.length > MAX_SIZE) {
        throw new Error(`stdin input exceeds maximum size of ${MAX_SIZE} characters`);
      }
    }
    return data.trim();
  })();
  return Promise.race([read, timeout]);
}
