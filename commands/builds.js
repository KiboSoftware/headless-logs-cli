import { Command } from 'commander';
import { getService } from '../util/service-factory.js';
import { withAuthOptions } from '../util/cli-options.js';
import { formatBuildOutput, formatError } from '../util/output.js';

export function createBuildsCommand() {
  const builds = new Command('builds')
    .description('Build management commands');

  withAuthOptions(builds.command('trigger')
    .description('Trigger an Amplify rebuild for a branch'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .action(async (options, cmd) => {
      try {
        const svc = getService(cmd);
        const data = await svc.triggerBuild(options.branch);
        if (options.json) {
          console.log(JSON.stringify(data));
        } else {
          console.log(formatBuildOutput(data));
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  return builds;
}
