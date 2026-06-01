import { NextResponse } from 'next/server';
import { isAllowedPublicS3Key } from '@/lib/s3-file-access';
import { getS3Object } from '@/lib/s3-server';

type ServeOptions = {
  cache?: 'public' | 'private';
};

export async function serveS3File(
  key: string,
  options: ServeOptions = {}
): Promise<NextResponse> {
  if (process.env.STORAGE_PROVIDER !== 's3') {
    return NextResponse.json({ error: 'Not configured' }, { status: 404 });
  }

  const cache = options.cache ?? 'public';
  if (cache === 'public' && !isAllowedPublicS3Key(key)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await getS3Object(key);
    if (!result.Body) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const bytes = await result.Body.transformToByteArray();
    const fileName = key.split('/').pop() || 'file';

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': result.ContentType || 'application/octet-stream',
        'Content-Length': String(bytes.byteLength),
        'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
        'Cache-Control':
          cache === 'private'
            ? 'private, no-store'
            : 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: unknown) {
    const name =
      error && typeof error === 'object' && 'name' in error
        ? String(error.name)
        : '';
    if (name === 'NoSuchKey' || name === 'NotFound') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('serve-s3-file error:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
