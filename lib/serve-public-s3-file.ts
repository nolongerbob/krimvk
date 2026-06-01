import { serveS3File } from '@/lib/serve-s3-file';

/** @deprecated use serveS3File */
export async function servePublicS3File(key: string) {
  return serveS3File(key, { cache: 'public' });
}
