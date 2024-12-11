## Overview

NodeJS CLI to download and extract build and runtime logs from your Kibo hosted headless application

## Requirements

* Kibo Tenant ID
* Kibo Site ID
* Kibo Application Key (Client ID )
* Kibo Shared Secret (Client Secret)
* Node >= 18


## Installation

```bash
npm install -g @kibocommerce/headless-logs-cli
```
## Env Template
Use env variables to populate arguments 

```ini
KIBO_TENANT=
KIBO_SITE=
KIBO_CLIENT_ID=
KIBO_CLIENT_SECRET=
LOG_DIR=
```
## Quick Directory Setup

This will setup folder and generate an env file for future use

```bash
npm install -g @kibocommerce/headless-logs-cli
mkdir production-logs
cd production-logs
kibo-headless-logs init -t <tenant-id> -s <site-id> -a <kibo-app-id> -k <secret> -o <output-dir>
```

Then run export from this directory to have tenat / site values auto populateds

```bash
kibo-headless-logs runtime-logs --prefix 2024-07-01
```

## Runtime Log Usage

### Filtering Logs

Providing `-p` or `--prefix`, in the format `YYYY-MM-DD-HH` to the command will filter logs to a date range.

Note: Date values are in UTC

#### Logs By Month
```bash
kibo-headless-logs rl -p 2024-07 -o ./runtime-logs -t 1234, -s 321, -a AppKey -k Secret
```
#### Logs By Day
```bash
kibo-headless-logs rl -p 2024-07-01 -o ./runtime-logs -t 1234, -s 321, -a AppKey -k Secret
```
### Logs By Day/Hour
```bash
kibo-headless-logs rl -p 2024-07-01-10 -o ./runtime-logs -t 1234, -s 321, -a AppKey -k Secret
```

### Logs By Day/Hour with Maximum Entries 
```bash
kibo-headless-logs rl -p 2024-07-01-10 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret --maxentries=3
```

### Logs By Day/Hour with Cutoff 
```bash
kibo-headless-logs rl --prefix=2024-12-10-01 --cutoff=2024-12-10-01-15 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret
```

## Build Log Usage

```bash
kibo-headless-logs get-build-logs --output buildlogs --tenant 1234 --site 1234 --client-id AppKey --client-secret Secret --branch kibo-sb-main --numberOfJobs 3 --home-host t1234-s1234.sandbox.mozu.com
```

shorthand;
```bash
kibo-headless-logs gbl --o buildlogs --t 1234 --s 1234 --a AppKey --k Secret --b kibo-sb-main --n 3 --h t1234-s1234.sandbox.mozu.com
```

## Viewer
View exported logs in tool such as https://github.com/allproxy/json-log-viewer