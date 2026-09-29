import { NextResponse } from 'next/server';
import { safeContentDisposition } from '@/lib/content-disposition';
import { isAllowedPublicS3Key } from '@/lib/s3-file-access';
import { getPresignedS3Url, getS3Object } from '@/lib/s3-server';

type ServeOptions = {
  cache?: 'public' | 'private';
};

function bodyToWebStream(body: unknown): ReadableStream<Uint8Array> | null {
  if (!body || typeof body !== 'object') return null;
  const streamBody = body as {
    transformToWebStream?: () => ReadableStream<Uint8Array>;
  };
  if (typeof streamBody.transformToWebStream === 'function') {
    return streamBody.transformToWebStream();
  }
  return null;
}

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
    if (cache === 'public' && process.env.S3_PRESIGNED_REDIRECT !== '0') {
      const signedUrl = await getPresignedS3Url(key, 900);
      return NextResponse.redirect(signedUrl, 302);
    }

    const result = await getS3Object(key);
    if (!result.Body) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const fileName = key.split('/').pop() || 'file';
    const contentType = result.ContentType || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': safeContentDisposition(contentType, fileName),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control':
        cache === 'private'
          ? 'private, no-store'
          : 'public, max-age=3600, s-maxage=3600',
    };

    const webStream = bodyToWebStream(result.Body);
    if (webStream) {
      if (result.ContentLength != null) {
        return new NextResponse(webStream, {
          status: 200,
          headers: {
            ...headers,
            'Content-Length': String(result.ContentLength),
          },
        });
      }
      return new NextResponse(webStream, { status: 200, headers });
    }

    const bytes = await result.Body.transformToByteArray();
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...headers,
        'Content-Length': String(bytes.byteLength),
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
