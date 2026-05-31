#!/usr/bin/env bash
# Проверка записи в Yandex Object Storage с .env приложения
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

node <<'NODE'
const { loadEnv } = require('./scripts/load-env');
const {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
} = require('@aws-sdk/client-s3');

// .env всегда важнее уже экспортированных AWS_* (иначе старые ключи из shell/PM2)
for (const k of [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_ENDPOINT',
  'S3_REGION',
  'STORAGE_PROVIDER',
]) {
  delete process.env[k];
}
loadEnv();

const bucket = process.env.S3_BUCKET_NAME;
const keyId = process.env.AWS_ACCESS_KEY_ID;
const secret = process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
const region = process.env.S3_REGION || 'ru-central1';

if (process.env.STORAGE_PROVIDER !== 's3') {
  console.error('STORAGE_PROVIDER не s3:', process.env.STORAGE_PROVIDER);
  process.exit(1);
}
if (!bucket || !keyId || !secret) {
  console.error('Заполните S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY в .env');
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId: keyId, secretAccessKey: secret },
});

function errMeta(e) {
  const code = e.$metadata?.httpStatusCode;
  return code ? `${e.name} (${code}): ${e.message}` : `${e.name}: ${e.message}`;
}

(async () => {
  console.log('Bucket:', bucket);
  console.log('Endpoint:', endpoint);
  console.log('Access key:', keyId ? `${keyId.slice(0, 12)}...` : '(empty)');
  try {
    const listed = await client.send(new ListBucketsCommand({}));
    const names = (listed.Buckets || []).map((b) => b.Name);
    console.log('ListBuckets:', names.length ? names.join(', ') : '(пусто — SA не видит бакетов)');
    if (names.length && !names.includes(bucket)) {
      console.error(`⚠ Бакет "${bucket}" не в списке SA — другой каталог/облако или имя`);
    }
  } catch (e) {
    console.error('ListBuckets FAIL:', errMeta(e));
  }
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('HeadBucket: OK');
  } catch (e) {
    console.error('HeadBucket FAIL:', errMeta(e));
  }
  const testKey = `test/s3-check-${Date.now()}.txt`;
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: 'krimvk s3 test',
        ContentType: 'text/plain',
      })
    );
    console.log('PutObject: OK →', testKey);
    console.log('URL:', `${endpoint}/${bucket}/${testKey}`);
  } catch (e) {
    console.error('PutObject FAIL:', errMeta(e));
    console.error('');
    console.error('Проверьте:');
    console.error('  1) AWS_ACCESS_KEY_ID в .env = ключ SA с ролью storage.editor (см. IAM → SA → Ключи)');
    console.error('  2) storage.editor на каталог default И на бакет (Безопасность → Права доступа)');
    console.error('  3) Политика бакета без Deny; GetObject для * не мешает записи');
    console.error('  4) Нет дубликатов AWS_* в .env (grep AWS_ .env)');
    process.exit(1);
  }
})();
NODE
