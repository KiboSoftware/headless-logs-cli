#!/usr/bin/env node
import { Command, Option } from 'commander';
import exportRuntimeLogs from '../commands/runtime-logs.js'
import getBuildLogs from '../commands/get-build-logs.js';
import { createEnvCommand } from '../commands/env.js';
import { createSecretsCommand } from '../commands/secrets.js';
import { createBuildsCommand } from '../commands/builds.js';
import fs from 'fs/promises';
import 'dotenv/config';
import path from 'node:path';

const program = new Command();

// Set program name dynamically based on how it was invoked
const invoked = path.basename(process.argv[1] || 'kibo-headless');
program.name(invoked);

program
    .version('3.0.1')
    .description('Kibo Headless CLI — manage env vars, secrets, builds, and logs')

program.command('init')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .addOption(new Option('-o, --output <dir>', 'Output directory for logs').env('LOG_DIR'))
    .action(async (options) => {
        const envContent = `KIBO_TENANT=${options.tenant ?? ''}
KIBO_SITE=${options.site ?? ''}
KIBO_CLIENT_ID=${options.clientId?? ''}
KIBO_CLIENT_SECRET=${options.clientSecret??''}
LOG_DIR=${options.output??''}`
        try {
            await fs.writeFile('.env', envContent, { mode: 0o600 });
            if(options.output) {
                await fs.mkdir(options.output, { recursive: true });
            }
            console.log('Initialized .env file');
        } catch (err) {
            process.stderr.write(`Error: Failed to initialize: ${err.message}\n`);
            process.exitCode = 1;
        }
})
program.command('env-template')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .addOption(new Option('-o, --output <dir>', 'Output directory for logs').env('LOG_DIR'))
    .action(async (options) => {
        const envContent = `KIBO_TENANT=
KIBO_SITE=
KIBO_CLIENT_ID=
KIBO_CLIENT_SECRET=
LOG_DIR=`
   console.log(envContent)
})
program.command('runtime-logs')
    .alias('rl')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .option('-f, --output-file <file>', 'Output path for combined logs', 'runtimelogs.ndjson')
    .addOption(new Option('-o, --output <dir>', 'Output directory for logs').env('LOG_DIR'))
    .option('--home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .option('-p, --prefix [prefix]', '')
    .option('-c, --cutoff [cutoff]', '')
    .option('-m, --maxentries [maxentries]', 'Maximum number of entries to fetch', (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            throw new Error('maxentries must be a number');
        }
        return parsed;
    })
    .action((options) => exportRuntimeLogs(options))

program.command('get-build-logs')
    .alias('gbl')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .requiredOption('-b, --branch <branch>', 'Kibo Amplify Branch Name')
    .option('-n, --numberOfJobs <numberOfLogs>', 'Number of Build logs to pull', 1)
    .addOption(new Option('-o, --output <dir>', 'Output dir for job logs').env('LOG_DIR'))
    .option('--home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .action((options) => getBuildLogs(options))

// --- Grouped aliases for existing log commands ---
const logsGroup = new Command('logs')
    .description('Log commands (aliases for runtime-logs and get-build-logs)');

logsGroup.command('runtime')
    .description('Fetch runtime logs (alias for runtime-logs)')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .option('-f, --output-file <file>', 'Output path for combined logs', 'runtimelogs.ndjson')
    .addOption(new Option('-o, --output <dir>', 'Output directory for logs').env('LOG_DIR'))
    .option('--home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .option('-p, --prefix [prefix]', '')
    .option('-c, --cutoff [cutoff]', '')
    .option('-m, --maxentries [maxentries]', 'Maximum number of entries to fetch', (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            throw new Error('maxentries must be a number');
        }
        return parsed;
    })
    .action((options) => exportRuntimeLogs(options));

logsGroup.command('build')
    .description('Fetch build logs (alias for get-build-logs)')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .requiredOption('-b, --branch <branch>', 'Kibo Amplify Branch Name')
    .option('-n, --numberOfJobs <numberOfLogs>', 'Number of Build logs to pull', 1)
    .addOption(new Option('-o, --output <dir>', 'Output dir for job logs').env('LOG_DIR'))
    .option('--home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .action((options) => getBuildLogs(options));

program.addCommand(logsGroup);

// --- New command groups ---
program.addCommand(createEnvCommand());
program.addCommand(createSecretsCommand());
program.addCommand(createBuildsCommand());

program.parse();
