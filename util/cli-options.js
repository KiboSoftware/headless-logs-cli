import { Option } from 'commander';

export function withAuthOptions(cmd) {
  return cmd
    .addOption(new Option('-t, --tenant <tenant>', 'Kibo Tenant ID').env('KIBO_TENANT'))
    .addOption(new Option('-s, --site <site>', 'Kibo Site ID').env('KIBO_SITE'))
    .addOption(new Option('-a, --client-id <clientId>', 'Kibo Application ID/Client ID').env('KIBO_CLIENT_ID'))
    .addOption(new Option('-k, --client-secret <clientSecret>', 'Kibo Shared Secret/Client Secret').env('KIBO_CLIENT_SECRET'))
    .option('--home-host <host>', 'Kibo home host', 'home.mozu.com');
}
