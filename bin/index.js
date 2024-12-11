import { Command, Option } from 'commander';
import exportRuntimeLogs from '../commands/runtime-logs.js'
import getBuildLogs from '../commands/get-build-logs.js';
import fs from 'fs/promises';
import 'dotenv/config';

const program = new Command();

program
    .version('1.0.0')
    .description('Fetch, unzip, and combine headless log files')

program.command('init')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .addOption(new Option('-o, --output <dir>', 'Output directory for logs').env('LOG_DIR'))
    .action(async (options) => {
        console.log
        const envContent = `KIBO_TENANT=${options.tenant ?? ''}
KIBO_SITE=${options.site ?? ''}
KIBO_CLIENT_ID=${options.clientId?? ''}
KIBO_CLIENT_SECRET=${options.clientSecret??''}
LOG_DIR=${options.output??''}`
        fs.writeFile('.env', envContent)
        if(options.output) {
            await fs.mkdir(options.output)
        }
})
program.command('env-template')
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .addOption(new Option('-o, --output <dir>', 'Output directory for logs').env('LOG_DIR'))
    .action(async (options) => {
        console.log
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
    .option('-h, --home-host [home-host]', 'Kibo home host', 'home.mozu.com')
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
    .option('-h, --home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .action((options) => getBuildLogs(options))

program.parse()
