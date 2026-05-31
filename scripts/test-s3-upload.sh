#!/usr/bin/env bash
# Проверка записи в Yandex Object Storage с .env приложения
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

node <<'NODE'
const { loadEnv } = require('./scripts/load-env');
const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

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

(async () => {
  console.log('Bucket:', bucket);
  console.log('Endpoint:', endpoint);
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('HeadBucket: OK');
  } catch (e) {
    console.error('HeadBucket FAIL:', e.name, e.message);
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
    console.error('PutObject FAIL:', e.name, e.message);
    console.error('');
    console.error('Проверьте:');
    console.error('  1) Статический ключ сервисного аккаунта (не KMS!)');
    console.error('  2) Роль storage.editor на каталог/бакет');
    console.error('  3) S3_BUCKET_NAME = имя бакета (krimvk)');
    process.exit(1);
  }
})();
NODE
