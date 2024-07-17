import { Command } from 'commander';
import exportRuntimeLogs from '../commands/runtime-logs.js'
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
    .action((options) => exportRuntimeLogs(options))
    
// program.command('get-build-logs').action(function() {
//     
// })

program.parse()