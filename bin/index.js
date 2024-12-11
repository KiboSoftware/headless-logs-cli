import { Command } from 'commander';
import exportRuntimeLogs from '../commands/runtime-logs.js'
import getBuildLogs from '../commands/get-build-logs.js';
const program = new Command();

program
    .version('1.0.0')
    .description('Fetch, unzip, and combine headless log files')

program.command('runtime-logs')
    .alias('rl')
    .requiredOption('-t, --tenant <tenant>', 'Kibo Tenant ID')
    .requiredOption('-s, --site <site>', 'Kibo Site ID')
    .requiredOption('-a, --client-id <clientId>', 'Kibo Application ID/Client ID')
    .requiredOption('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret')
    .option('-o, --output <file>', 'Output path for combined logs', 'runtimelogs.ndjson')
    .option('-h, --home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .option('-f, --prefix [prefix]', '')
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
    .requiredOption('-t, --tenant <tenant>', 'Kibo Tenant ID')
    .requiredOption('-s, --site <site>', 'Kibo Site ID')
    .requiredOption('-a, --client-id <clientId>', 'Kibo Application ID/Client ID')
    .requiredOption('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret')
    .requiredOption('-b, --branch <branch>', 'Kibo Amplify Branch Name')
    .option('-n, --numberOfJobs <numberOfLogs>', 'Number of Build logs to pull', 1)
    .option('-o, --output <dir>', 'Output dir for job logs', 'buildlogs')
    .option('-h, --home-host [home-host]', 'Kibo home host', 'home.mozu.com')
    .action((options) => getBuildLogs(options))

program.parse()