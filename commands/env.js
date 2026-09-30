import { Command } from 'commander';
import { getService } from '../util/service-factory.js';
import { withAuthOptions } from '../util/cli-options.js';
import { validateName, validateValue } from '../util/validation.js';
import { formatEnvOutput, formatError } from '../util/output.js';
import fs from 'fs/promises';

export function createEnvCommand() {
  const env = new Command('env')
    .description('Manage environment variables');

  withAuthOptions(env.command('list')
    .description('List all environment variables for a branch'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .action(async (options, cmd) => {
      try {
        const svc = getService(cmd);
        const data = await svc.listEnvVars(options.branch);
        if (options.json) {
          console.log(JSON.stringify(data));
        } else {
          const output = formatEnvOutput(data);
          if (!output) {
            process.stderr.write(`No environment variables found for branch: ${options.branch}\n`);
          } else {
            console.log(output);
          }
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  withAuthOptions(env.command('set')
    .description('Create or update an environment variable'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .requiredOption('-n, --name <name>', 'Variable name')
    .option('--value <value>', 'Variable value')
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
          const { readStdin } = await import('../util/output.js');
          value = await readStdin();
          if (value === null) {
            process.stderr.write('Error: --value-stdin specified but no data piped to stdin\n');
            process.exitCode = 1;
            return;
          }
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
        const result = await svc.setEnvVar(options.branch, options.name, value);
        if (options.json) {
          console.log(JSON.stringify(result));
        } else {
          console.log(`Set: ${options.name}`);
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  withAuthOptions(env.command('delete')
    .description('Delete an environment variable'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .requiredOption('-n, --name <name>', 'Variable name to delete')
    .action(async (options, cmd) => {
      try {
        const svc = getService(cmd);
        const result = await svc.deleteEnvVar(options.branch, options.name);
        if (options.json) {
          console.log(JSON.stringify(result));
        } else {
          console.log(`Deleted: ${options.name}`);
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  withAuthOptions(env.command('import')
    .description('Import variables from a .env file'))
    .option('--json', 'Output raw JSON response', false)
    .requiredOption('-b, --branch <branch>', 'Amplify branch name')
    .requiredOption('-f, --file <path>', 'Path to .env file')
    .action(async (options, cmd) => {
      try {
        let content;
        try {
          content = await fs.readFile(options.file, 'utf-8');
        } catch {
          process.stderr.write(`Error: File not found: ${options.file}\n`);
          process.exitCode = 1;
          return;
        }

        const vars = parseEnvFile(content);
        if (vars.length === 0) {
          process.stderr.write(`No variables found in ${options.file}\n`);
          process.exitCode = 1;
          return;
        }

        const svc = getService(cmd);
        console.log(`Importing ${vars.length} variables from ${options.file}...`);

        let succeeded = 0;
        const failed = [];
        for (const { name, value } of vars) {
          try {
            await svc.setEnvVar(options.branch, name, value);
            console.log(`Set: ${name}`);
            succeeded++;
          } catch (varErr) {
            failed.push({ name, error: varErr.message });
            process.stderr.write(`Failed to set ${name}: ${varErr.message}\n`);
          }
        }

        if (failed.length > 0) {
          process.stderr.write(`Import partially failed: ${succeeded} set, ${failed.length} failed\n`);
          process.exitCode = 1;
        } else {
          console.log(`Import complete: ${vars.length} variables set for branch ${options.branch}`);
        }
      } catch (err) {
        process.stderr.write(formatError(err.errorData || err) + '\n');
        process.exitCode = 1;
      }
    });

  return env;
}

/**
 * Parse a .env file into name/value pairs.
 * Skips comments (#) and blank lines. Splits on first '='.
 * Strips matched surrounding quotes from values.
 */
function parseEnvFile(content) {
  const vars = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const name = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      process.stderr.write(`Warning: Skipped invalid line ${i + 1}: "${trimmed}"\n`);
      continue;
    }
    vars.push({ name, value });
  }
  return vars;
}
