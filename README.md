## Overview

NodeJS CLI to download and extract build and runtime logs from your Kibo hosted headless application

## Requirements

* Kibo Tenant ID
* Kibo Site ID
* Kibo Application Key (Client ID )
* Kibo Shared Secret (Client Secret)

## Installation

```bash
npm install -g @kibocommerce/headless-logs-cli
```

## Runtime Log Usage

#### All Logs

```bash
kibo-headless-logs runtime-logs --output ~/log-export.ndjson --tenant 1234, --site 321, --client-id AppKey --client-secret Secret
```
shorthand:
```bash
kibo-headless-logs rl -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret
```
### Filtering Logs

Providing `-p` or `--prefix`, in the format `YYYY-MM-DD-HH` to the command will filter logs to a date range.

Note: Date values are in UTC

#### Logs By Month
```bash
kibo-headless-logs rl -p 2024-07 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret
```
#### Logs By Day
```bash
kibo-headless-logs rl -p 2024-07-01 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret
```
### Logs By Day/Hour
```bash
kibo-headless-logs rl -p 2024-07-01-10 -o ~/log-export.ndjson -t 1234, -s 321, -a AppKey -s Secret
```

## Build Log Usage

```bash
kibo-headless-logs get-build-logs --output buildlogs --tenant 1234 --site 1234 --client-id AppKey --client-secret Secret --branch kibo-sb-main --numberOfJobs 3 --home-host t1234-s1234.sandbox.mozu.com
```

shorthand;
```bash
kibo-headless-logs get-build-logs --o buildlogs --t 1234 --s 1234 --a AppKey --k Secret --b kibo-sb-main --n 3 --h t1234-s1234.sandbox.mozu.com
```