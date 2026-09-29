// Creates a dedicated loopback-only PostgreSQL cluster, never uses .env DATABASE_URL.
import { mkdirSync, existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') throw new Error('Local setup cannot run in production');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, '.local-dev');
const data = path.join(dir, 'postgres');
const bin = process.env.PG_BIN || '/opt/homebrew/opt/postgresql@16/bin';
const configPath = path.join(dir, 'environment.json');
mkdirSync(dir, { recursive: true, mode: 0o700 });
if (!existsSync(configPath)) {
  writeFileSync(configPath, JSON.stringify({
    databasePassword: randomBytes(24).toString('hex'),
    adminEmail: 'admin@krimvk.test', adminPassword: randomBytes(24).toString('base64url'),
    authSecret: randomBytes(32).toString('hex'),
  }, null, 2), { mode: 0o600, flag: 'wx' });
}
chmodSync(configPath, 0o600);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const databaseUrl = `postgresql://krimvk_dev:${encodeURIComponent(config.databasePassword)}@127.0.0.1:55435/krimvk_dev`;
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error(`Local setup step failed: ${path.basename(command)}`);
}
if (!existsSync(path.join(data, 'PG_VERSION'))) {
  const pwfile = path.join(dir, 'postgres-password');
  writeFileSync(pwfile, config.databasePassword, { mode: 0o600 });
  run(path.join(bin, 'initdb'), ['-D', data, '-U', 'krimvk_dev', '--auth-host=scram-sha-256', '--auth-local=trust', '--encoding=UTF8', '--locale=C', `--pwfile=${pwfile}`]);
}
const status = spawnSync(path.join(bin, 'pg_ctl'), ['-D', data, 'status'], { stdio: 'ignore' });
if (status.status !== 0) {
  run(path.join(bin, 'pg_ctl'), ['-D', data, '-l', path.join(dir, 'postgres.log'), '-o', "-h 127.0.0.1 -p 55435 -k ''", '-w', 'start']);
}
const bootstrapUrl = new URL(databaseUrl);
bootstrapUrl.pathname = '/postgres';
const client = new pg.Client({ connectionString: bootstrapUrl.toString(), connectionTimeoutMillis: 3000 });
await client.connect();
try {
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = 'krimvk_dev'");
  if (!rows.length) await client.query('CREATE DATABASE krimvk_dev OWNER krimvk_dev');
} finally { await client.end(); }
run(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl });
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
try {
  const existing = await prisma.user.findUnique({ where: { email: config.adminEmail } });
  if (!existing) await prisma.user.create({ data: {
    email: config.adminEmail, password: await bcrypt.hash(config.adminPassword, 12),
    name: 'Тестовый администратор', role: 'ADMIN', emailVerified: new Date(),
  } });
  else if (existing.role !== 'ADMIN' || !existing.password || !await bcrypt.compare(config.adminPassword, existing.password)) {
    throw new Error('Existing test account differs; refusing to change its password or permissions');
  }
  console.log('Local database ready: 127.0.0.1:55435/krimvk_dev. Test administrator verified.');
  console.log('Credentials remain in the git-ignored .local-dev/environment.json (mode 600).');
} finally { await prisma.$disconnect(); }
