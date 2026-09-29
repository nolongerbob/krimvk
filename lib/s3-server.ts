import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let sharedClient: S3Client | null = null;

export function createS3Client(): S3Client {
  if (sharedClient) return sharedClient;

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  const region = process.env.S3_REGION || 'ru-central1';
  sharedClient = new S3Client({
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

  return sharedClient;
}

export function getS3BucketName(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }
  return bucket;
}

export async function getS3Object(key: string) {
  const client = createS3Client();
  return client.send(
    new GetObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
    })
  );
}

export async function getPresignedS3Url(
  key: string,
  expiresInSeconds = 900
): Promise<string> {
  const client = createS3Client();
  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
