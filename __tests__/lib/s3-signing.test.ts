/** @jest-environment node */
import { getPresignedS3Url } from '@/lib/s3-server';

it('signs a private object locally with compatible S3 packages, without a network request', async () => {
  const original = { ...process.env };
  try {
    process.env.S3_ENDPOINT = 'https://storage.example.test';
    process.env.S3_REGION = 'ru-central1';
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    const result = new URL(await getPresignedS3Url('applications/user/test/document.pdf', 60));
    expect(result.hostname).toBe('storage.example.test');
    expect(result.pathname).toBe('/test-bucket/applications/user/test/document.pdf');
    expect(result.searchParams.get('X-Amz-Expires')).toBe('60');
    expect(result.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
  } finally { process.env = original; }
});
