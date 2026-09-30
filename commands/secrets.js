import { Command } from 'commander';
import { getService } from '../util/service-factory.js';
import { withAuthOptions } from '../util/cli-options.js';
import { validateName, validateValue } from '../util/validation.js';
import { formatSecretsOutput, formatError, readStdin } from '../util/output.js';

export function createSecretsCommand() {
  const secrets = new Command('secrets')
    .description('Manage secrets (write-only values)');

  withAuthOptions(secrets.command('list')
    .description('List secret names for a branch (never values)'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .action(async (options, cmd) => {
      try {
        const svc = getService(cmd);
        const data = await svc.listSecrets(options.branch);
        if (options.json) {
          console.log(JSON.stringify(data));
        } else {
          const output = formatSecretsOutput(data);
          if (!output) {
            process.stderr.write(`No secrets found for branch: ${options.branch}\n`);
          } else {
            console.log(output);
          }
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  withAuthOptions(secrets.command('set')
    .description('Store or update a secret (write-only)'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .requiredOption('-n, --name <name>', 'Secret name')
    .option('--value <value>', 'Secret value')
    .option('--value-stdin', 'Read value from stdin pipe')
    .action(async (options, cmd) => {
      try {
        const nameCheck = validateName(options.name);
        if (!nameCheck.valid) {
          process.stderr.write(`Error: ${nameCheck.error}\n`);
          process.exitCode = 1;
          return;
        }

        let value = options.value;
        if (options.valueStdin) {
          value = await readStdin();
          if (value === null) {
            process.stderr.write('Error: --value-stdin specified but no data piped to stdin\n');
            process.exitCode = 1;
            return;
          }
        } else if (value !== undefined) {
          // Warn about shell history when --value is used directly
          process.stderr.write('⚠ Warning: Secret value may be visible in shell history. Use --value-stdin for production: echo $SECRET | kibo-headless secrets set --value-stdin -b main -n NAME\n');
        }

        if (value === undefined || value === null) {
          process.stderr.write('Error: --value or --value-stdin is required\n');
          process.exitCode = 1;
          return;
        }

        const valCheck = validateValue(value);
        if (!valCheck.valid) {
          process.stderr.write(`Error: ${valCheck.error}\n`);
          process.exitCode = 1;
          return;
        }

        const svc = getService(cmd);
        const result = await svc.setSecret(options.branch, options.name, value);
        if (options.json) {
          console.log(JSON.stringify({ name: options.name }));
        } else {
          console.log(`Set secret: ${options.name}`);
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  withAuthOptions(secrets.command('delete')
    .description('Remove a secret'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .requiredOption('-n, --name <name>', 'Secret name to delete')
    .action(async (options, cmd) => {
      try {
        const svc = getService(cmd);
        await svc.deleteSecret(options.branch, options.name);
        if (options.json) {
          console.log(JSON.stringify({}));
        } else {
          console.log(`Deleted secret: ${options.name}`);
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  return secrets;
}
