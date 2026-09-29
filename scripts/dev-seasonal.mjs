// Local visual testing only. Do not inherit production integrations from .env.
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';

if (process.env.NODE_ENV === 'production') throw new Error('Dev launcher cannot run in production');
const esiaPreview = process.argv.includes('--esia-preview');
if (esiaPreview && !process.argv.includes('--yandex-auth') && process.argv.some(arg => ['--with-db', '--assistant', '--support'].includes(arg))) {
  throw new Error('ESIA preview must run without database or external integrations');
}
if (esiaPreview && process.argv.includes('--yandex-auth') && process.argv.some(arg => ['--assistant', '--support'].includes(arg))) throw new Error('OAuth testing cannot enable external support integrations');
const port = esiaPreview ? '3006' : '3005';
const vkAuth = process.argv.includes('--vk-auth');
if (vkAuth && (!esiaPreview || !process.argv.includes('--with-db') || !process.argv.includes('--yandex-auth'))) throw new Error('VK dev requires isolated OAuth database mode');
const authOrigin = vkAuth ? 'https://dev.krimvk.ru' : `http://localhost:${port}`;
const localConfig = process.argv.includes('--with-db')
  ? JSON.parse(readFileSync(new URL('../.local-dev/environment.json', import.meta.url), 'utf8'))
  : null;
const localDatabaseUrl = localConfig
  ? `postgresql://krimvk_dev:${encodeURIComponent(localConfig.databasePassword)}@127.0.0.1:55435/krimvk_dev`
  : 'postgresql://preview:preview@127.0.0.1:1/preview?connect_timeout=1';
const oneCReadOnly = process.argv.includes('--1c-read-only');
if (oneCReadOnly && !localConfig) throw new Error('--1c-read-only requires --with-db');

const env = { ...process.env };
const yandexAuth = process.argv.includes('--yandex-auth');
let yandexClientId = '', yandexClientSecret = '';
if (yandexAuth) {
  const contents = readFileSync(new URL('../.local-dev/yandex.env', import.meta.url), 'utf8');
  yandexClientId = contents.match(/^YANDEX_CLIENT_ID=(.+)$/m)?.[1]?.trim() || '';
  yandexClientSecret = contents.match(/^YANDEX_CLIENT_SECRET=(.+)$/m)?.[1]?.trim() || '';
  if (!yandexClientId || !yandexClientSecret) throw new Error('Yandex dev credentials are not configured');
}
let mapsKey = '';
if (process.argv.includes('--google-maps')) {
  mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (!mapsKey) {
    try { mapsKey = readFileSync('.local-dev/maps.env', 'utf8').match(/^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)$/m)?.[1]?.trim() || ''; } catch {}
  }
  if (!mapsKey) throw new Error('Google Maps dev key is not configured');
}
// Explicit opt-in imports ONLY the assistant key, not database or integrations.
let assistantKey = '';
if (process.argv.includes('--assistant')) {
  assistantKey = process.env.DEEPSEEK_API_KEY || '';
  for (const file of ['.local-dev/assistant.env', '.env.local']) {
    if (assistantKey) break;
    try {
      const line = readFileSync(file, 'utf8').match(/^\s*(?:export\s+)?DEEPSEEK_API_KEY\s*=\s*(.+)\s*$/m)?.[1]?.trim();
      assistantKey = line?.replace(/^(['"])(.*)\1$/, '$2') || '';
    } catch { /* Key can instead be supplied through the process environment. */ }
  }
  if (!assistantKey) throw new Error('DeepSeek key is not configured');
}
if (process.argv.includes('--support') && !localConfig) throw new Error('--support requires --with-db');
for (const file of ['.env', '.env.local', '.env.development', '.env.development.local']) {
  let contents;
  try { contents = readFileSync(file, 'utf8'); } catch { continue; }
  for (const line of contents.split('\n')) {
    const key = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)?.[1];
    if (key && !['HOME', 'PATH', 'SHELL', 'USER', 'TMPDIR', 'CODEX_HOME'].includes(key)) env[key] = '';
  }
}
Object.assign(env, {
  NODE_ENV: 'development',
  DATABASE_URL: localDatabaseUrl,
  DIRECT_URL: localDatabaseUrl,
  ONE_C_API_BASE_URL: oneCReadOnly ? 'http://46.172.223.34' : 'http://127.0.0.1:1',
  ONE_C_READ_ONLY: 'true',
  PASSWORD1C_ENCRYPTION_KEY: localConfig ? createHash('sha256').update(`krimvk-dev-password1c:${localConfig.authSecret}`).digest('base64') : '',
  REDIS_URL: '', RESEND_API_KEY: '', BLOB_READ_WRITE_TOKEN: '',
  AWS_ACCESS_KEY_ID: '', AWS_SECRET_ACCESS_KEY: '', S3_ENDPOINT: 'http://127.0.0.1:1',
  NTFY_ALERT_ENABLED: 'false', TELEGRAM_ALERT_BOT_TOKEN: '', TELEGRAM_ALERT_CHAT_ID: '',
  NEXTAUTH_URL: authOrigin, SITE_URL: authOrigin,
  VK_AUTH_ENABLED: vkAuth ? 'true' : '',
  NEXTAUTH_SECRET: localConfig?.authSecret || randomBytes(32).toString('hex'),
  DISABLE_CANONICAL_HOST_REDIRECT: 'true',
  SEASONAL_DEV_DIST: '1', NEXT_PUBLIC_ASSET_PREFIX: '',
  ESIA_DEV_PREVIEW: esiaPreview ? 'true' : '',
  YANDEX_AUTH_ENABLED: yandexAuth ? 'true' : '',
  YANDEX_CLIENT_ID: yandexClientId,
  YANDEX_CLIENT_SECRET: yandexClientSecret,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: mapsKey,
  NEXT_PUBLIC_HOME_VISUAL_PREVIEW: process.argv.includes('--home-preview') ? 'true' : '',
  DEEPSEEK_API_KEY: assistantKey || '', ASSISTANT_TEST_SUPPORT_ENABLED: localConfig && process.argv.includes('--support') ? 'true' : '',
});
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', port], { env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
