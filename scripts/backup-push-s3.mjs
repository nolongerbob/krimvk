#!/usr/bin/env node
/**
 * Upload DB dump to Yandex Object Storage (no awscli required).
 * Env: AWS_*, S3_*, BACKUP_S3_PREFIX, S3_RETENTION_DAYS
 */
import { createReadStream } from 'fs';
import { basename, resolve } from 'path';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Usage: node backup-push-s3.mjs /path/to/db_*.sql.gz');
  process.exit(1);
}

const bucket = process.env.S3_BUCKET_NAME;
const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
const region = process.env.S3_REGION || 'ru-central1';
const prefix = (process.env.BACKUP_S3_PREFIX || 'backups/db').replace(/\/$/, '');
const retentionDays = Number(process.env.S3_RETENTION_DAYS || 90);

if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY required');
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle:
    process.env.S3_FORCE_PATH_STYLE === '1' ||
    process.env.S3_FORCE_PATH_STYLE === 'true' ||
    Boolean(endpoint),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const key = `${prefix}/${basename(resolve(backupFile))}`;
const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

async function upload() {
  console.log(`Uploading ${backupFile} -> s3://${bucket}/${key}`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(backupFile),
      ContentType: 'application/gzip',
    })
  );
}

async function prune() {
  console.log(`Pruning objects older than ${retentionDays} days under ${prefix}/`);
  let token;
  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${prefix}/`,
        ContinuationToken: token,
      })
    );
    for (const obj of list.Contents ?? []) {
      if (!obj.Key || !obj.LastModified) continue;
      if (obj.LastModified.getTime() < cutoff) {
        console.log(`Deleting s3://${bucket}/${obj.Key}`);
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key })
        );
      }
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);
}

await upload();
await prune();
console.log('Done');
