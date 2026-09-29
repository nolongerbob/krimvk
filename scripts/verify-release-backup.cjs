#!/usr/bin/env node
// Run from the live app directory. Reads its DB, restores ONLY into a new private cluster.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function run(file, args, env = process.env) {
  const r = spawnSync(file, args, { env, encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) throw new Error(`${path.basename(file)} failed (exit ${r.status}); inspect the retained backup directory. No production restore attempted.`);
  return r.stdout;
}

async function main() {
  if (process.argv[2] !== '--backup-and-verify') throw new Error('Explicit --backup-and-verify is required');
  const base = process.env.RELEASE_BACKUP_ROOT;
  if (!base || !path.isAbsolute(base) || base === '/') throw new Error('Set RELEASE_BACKUP_ROOT to a private absolute directory');
  require(path.join(process.cwd(), 'node_modules/@next/env')).loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const url = new URL(process.env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Expected PostgreSQL');
  const bin = process.env.PG_BIN || '/usr/lib/postgresql/16/bin';
  for (const command of ['pg_dump', 'pg_restore', 'initdb', 'pg_ctl', 'createdb', 'psql']) fs.accessSync(path.join(bin, command), fs.constants.X_OK);
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  const root = fs.mkdtempSync(path.join(base, 'release-check-'));
  fs.chmodSync(root, 0o700);
  const dump = path.join(root, 'database.dump');
  const data = path.join(root, 'postgres');
  // Keep Unix socket path short and private; no TCP listener is opened.
  const socket = fs.mkdtempSync('/tmp/krimvk-restore-');
  fs.chmodSync(socket, 0o700);
  const source = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGCONNECT_TIMEOUT: '10' };
  if (url.searchParams.has('sslmode')) source.PGSSLMODE = url.searchParams.get('sslmode');
  console.log(`Backup directory: ${root}`);
  run(path.join(bin, 'pg_dump'), ['--format=custom', '--no-owner', '--lock-wait-timeout=5000', '--file', dump], source);
  fs.chmodSync(dump, 0o600);
  if (!fs.statSync(dump).size) throw new Error('Empty backup');
  run(path.join(bin, 'pg_restore'), ['--list', dump]);
  const isolated = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C', PGHOST: socket, PGPORT: '55439', PGUSER: 'release_check', PGDATABASE: 'release_check' };
  run(path.join(bin, 'initdb'), ['-D', data, '--username=release_check', '--auth=trust', '--no-locale', '--encoding=UTF8'], isolated);
  let started = false;
  try {
    run(path.join(bin, 'pg_ctl'), ['-D', data, '-l', path.join(root, 'postgres.log'), '-o', `-c listen_addresses='' -c unix_socket_directories='${socket}' -p 55439`, '-w', 'start'], isolated);
    started = true;
    run(path.join(bin, 'createdb'), ['release_check'], isolated);
    run(path.join(bin, 'pg_restore'), ['--exit-on-error', '--no-owner', '--no-acl', '--dbname=release_check', dump], isolated);
    const tables = run(path.join(bin, 'psql'), ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', "SELECT count(*) FROM pg_tables WHERE schemaname='public'"], isolated).trim();
    if (!Number(tables)) throw new Error('Restore has no public tables');
    console.log(JSON.stringify({ restored: true, publicTables: Number(tables), backupBytes: fs.statSync(dump).size, directory: root }));
  } finally {
    if (started) run(path.join(bin, 'pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop'], isolated);
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
