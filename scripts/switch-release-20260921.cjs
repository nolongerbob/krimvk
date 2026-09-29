#!/usr/bin/env node
// One-time, guarded switch for the inspected VPS. Run only after candidate checks.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const release = '/home/krimvk/releases/web-20260921.sNaxgE';
const config = '/etc/nginx/sites-available/krimvk';
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });
function healthy(url, extra = []) {
  const data = JSON.parse(run('curl', ['-fsS', '--max-time', '10', ...extra, url]));
  if (data.ok !== true || data.checks?.db !== true) throw new Error('Health check failed');
}
function atomic(text) {
  const temporary = `${config}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, text, { mode: 0o644, flag: 'wx' });
  fs.renameSync(temporary, config);
}
if (process.getuid() !== 0 || process.argv[2] !== '--switch') {
  console.error('Run as root with --switch after the release is ready.'); process.exit(2);
}
let changed = false, original, backup;
try {
  const processes = JSON.parse(run('runuser', ['-u', 'krimvk', '--', 'pm2', 'jlist']));
  const candidate = processes.find(p => p.name === 'krimvk-release-20260921');
  const old = processes.find(p => p.name === 'krimvk');
  const e = candidate?.pm2_env;
  if (!e || e.status !== 'online' || e.pm_cwd !== release || Number(e.PORT) !== 3002 || e.HEALTHCHECK_DB !== '1') throw new Error('Candidate is not ready');
  if (old?.pm2_env?.status !== 'online' || Number(old.pm2_env.PORT) !== 3000) throw new Error('Old process is not available for rollback');
  if (e.METER_SUBMISSION_DIR !== '/var/www/krimvk/.meter-submissions') throw new Error('Meter journal mismatch');
  require('/var/www/krimvk/node_modules/@next/env').loadEnvConfig('/var/www/krimvk', false, { info() {}, error() {} });
  if (e.DATABASE_URL !== process.env.DATABASE_URL || e.NEXTAUTH_SECRET !== process.env.NEXTAUTH_SECRET) throw new Error('Candidate database/session environment mismatch');
  healthy('http://127.0.0.1:3002/api/health', ['-H', 'Host: krimvk.ru']);
  const settings = JSON.parse(run('curl', ['-fsS', '--max-time', '10', '-H', 'Host: krimvk.ru', 'http://127.0.0.1:3002/api/site-settings']));
  if (settings.mascotEnabled !== false || settings.autumnEnabled !== false) throw new Error('New effects must start disabled');
  original = fs.readFileSync(config, 'utf8');
  const block = /upstream\s+krimvk_prod\s*\{[^}]*\}/g;
  const matches = original.match(block);
  if (matches?.length !== 1 || !/server\s+127\.0\.0\.1:3000\s*;/.test(matches[0])) throw new Error('Nginx upstream differs from the inspected configuration');
  const nextBlock = matches[0].replace(/server\s+127\.0\.0\.1:3000\s*;/, 'server 127.0.0.1:3002;');
  const updated = original.replace(block, nextBlock);
  fs.mkdirSync('/root/krimvk-nginx-backups', { recursive: true, mode: 0o700 });
  backup = `/root/krimvk-nginx-backups/before-20260921-${randomUUID()}.conf`;
  fs.writeFileSync(backup, original, { mode: 0o600, flag: 'wx' });
  atomic(updated); changed = true;
  run('nginx', ['-t']);
  run('systemctl', ['reload', 'nginx']);
  healthy('https://krimvk.ru/api/health', ['--resolve', 'krimvk.ru:443:127.0.0.1']);
  const build = fs.readFileSync(`${release}/.next/BUILD_ID`, 'utf8').trim();
  run('curl', ['-fsS', '--max-time', '10', '--resolve', 'krimvk.ru:443:127.0.0.1', `https://krimvk.ru/_next/static/${encodeURIComponent(build)}/_buildManifest.js`]);
  console.log('Switched to the new release. Old process remains available on port 3000.');
  console.log(`Rollback config: ${backup}`);
} catch (error) {
  console.error('Switch failed:', error.message?.split('\n')[0]);
  if (changed) {
    try { atomic(original); run('nginx', ['-t']); run('systemctl', ['reload', 'nginx']); console.error('Old upstream restored.'); }
    catch { console.error(`URGENT: restore Nginx from ${backup} and reload manually.`); }
  }
  process.exitCode = 1;
}
