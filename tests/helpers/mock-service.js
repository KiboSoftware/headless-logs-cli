/**
 * Mock HeadlessService for command tests.
 * Provides configurable responses for each service method.
 */
export function createMockService(overrides = {}) {
  return {
    listEnvVars: overrides.listEnvVars ?? (async () => ({ items: [] })),
    setEnvVar: overrides.setEnvVar ?? (async () => ({})),
    deleteEnvVar: overrides.deleteEnvVar ?? (async () => ({})),
    listSecrets: overrides.listSecrets ?? (async () => ({ items: [] })),
    setSecret: overrides.setSecret ?? (async () => ({})),
    deleteSecret: overrides.deleteSecret ?? (async () => ({})),
    triggerBuild: overrides.triggerBuild ?? (async () => ({ jobId: 'mock-job', branchName: 'main', status: 'PENDING', startTime: '2026-06-01T12:00:00Z' })),
  };
}
