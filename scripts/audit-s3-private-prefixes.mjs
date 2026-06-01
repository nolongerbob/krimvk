#!/usr/bin/env node
/**
 * Проверка public-read (grant AllUsers) в приватных префиксах S3.
 * Без AWS CLI — только @aws-sdk/client-s3 из проекта.
 *
 *   cd /var/www/krimvk && set -a && source .env && set +a
 *   node scripts/audit-s3-private-prefixes.mjs
 */
import {
  GetObjectAclCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

const PRIVATE_PREFIXES = [
  'applications/',
  'messages/',
  'meters/',
  'contracts/',
];

function createClient() {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  const region = process.env.S3_REGION || 'ru-central1';
  return new S3Client({
    region,
    endpoint,
    forcePathStyle:
      process.env.S3_FORCE_PATH_STYLE === '1' ||
      process.env.S3_FORCE_PATH_STYLE === 'true' ||
      Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

function isPublicAcl(grants) {
  if (!grants?.length) return false;
  return grants.some(
    (g) =>
      g.Grantee?.Type === 'Group' &&
      (g.Grantee.URI ===
        'http://acs.amazonaws.com/groups/global/AllUsers' ||
        g.Grantee.URI?.includes('AllUsers'))
  );
}

async function listAllKeys(client, bucket, prefix) {
  const keys = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
        MaxKeys: 500,
      })
    );
    for (const item of res.Contents || []) {
      if (item.Key) keys.push(item.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function main() {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    console.error('S3_BUCKET_NAME is not set');
    process.exit(1);
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY not set');
    process.exit(1);
  }

  if (process.env.S3_USE_ACL === '0') {
    console.log(
      'S3_USE_ACL=0 — ACL на upload не ставятся. Защита только через /api/files/private.'
    );
    console.log(
      'Если старые файлы заливали с public-read, проверьте вручную в консоли Yandex Object Storage.'
    );
    process.exit(0);
  }

  const client = createClient();
  let publicCount = 0;
  let checked = 0;

  for (const prefix of PRIVATE_PREFIXES) {
    console.log(`=== s3://${bucket}/${prefix} ===`);
    const keys = await listAllKeys(client, bucket, prefix);
    if (!keys.length) {
      console.log('(no objects)');
      continue;
    }

    for (const key of keys) {
      checked++;
      try {
        const acl = await client.send(
          new GetObjectAclCommand({ Bucket: bucket, Key: key })
        );
        if (isPublicAcl(acl.Grants)) {
          console.log(`PUBLIC: ${key}`);
          publicCount++;
        }
      } catch (err) {
        const msg = err?.name || err?.message || String(err);
        console.log(`SKIP (${msg}): ${key}`);
      }
    }
  }

  console.log(`Checked ${checked} object(s).`);
  if (publicCount === 0) {
    console.log('OK: no AllUsers grant in private prefixes.');
    process.exit(0);
  }
  console.warn(
    `WARN: ${publicCount} object(s) with public ACL — re-upload or fix in console.`
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
