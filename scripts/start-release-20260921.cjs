#!/usr/bin/env node
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const release = '/home/krimvk/releases/web-20260921.sNaxgE';
if (process.argv[2] !== '--start' || process.cwd() !== release || process.getuid() === 0) throw new Error('Run as krimvk inside the prepared release, with --start');
process.env.NODE_ENV = 'production';
require('@next/env').loadEnvConfig(release, false, { info() {}, error() {} });
const existing = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
if (existing.some(p => p.name === 'krimvk-release-20260921')) throw new Error('Candidate already exists; inspect it instead of replacing it');
const journal = '/var/www/krimvk/.meter-submissions';
fs.accessSync(journal, fs.constants.R_OK | fs.constants.W_OK);
const shared = '/home/krimvk/release-shared';
fs.mkdirSync(`${shared}/assistant-budget`, { recursive: true, mode: 0o700 });
const key = fs.readFileSync(`${shared}/assistant.env`, 'utf8').match(/^DEEPSEEK_API_KEY\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^(['"])(.*)\1$/, '$2');
if (!key || !process.env.NEXTAUTH_SECRET || !process.env.DATABASE_URL || !process.env.PASSWORD1C_ENCRYPTION_KEY) throw new Error('Missing production secrets');
Object.assign(process.env, {
  PORT: '3002', HEALTHCHECK_DB: '1', METER_SUBMISSION_DIR: journal,
  NEXT_PUBLIC_ASSISTANT_ENABLED: 'true', NEXT_PUBLIC_SEASONAL_ENABLED: 'true', NEXT_PUBLIC_SITE_NOTICES_ENABLED: 'true',
  ASSISTANT_OPERATOR_ENABLED: 'true', DEEPSEEK_API_KEY: key,
  ASSISTANT_BUDGET_DIR: `${shared}/assistant-budget`, SITE_RUNTIME_SETTINGS_FILE: `${shared}/site-settings.json`,
});
execFileSync('pm2', ['start', 'node_modules/next/dist/bin/next', '--name', 'krimvk-release-20260921', '--cwd', release, '--max-memory-restart', '768M', '--', 'start', '-H', '127.0.0.1', '-p', '3002'], { env: process.env, stdio: 'inherit' });
console.log('Candidate started on loopback port 3002. No traffic switched.');
