import { NextRequest, NextResponse } from 'next/server';
import { publicFilePathForS3Key } from '@/lib/public-file-url';
import { servePublicS3File } from '@/lib/serve-public-s3-file';

export const runtime = 'nodejs';

/** Старый формат ?key= — редирект на /files/... */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const pretty = publicFilePathForS3Key(key);
  if (request.nextUrl.pathname === '/api/public-file') {
    return NextResponse.redirect(new URL(pretty, request.url), 301);
  }

  return servePublicS3File(key);
}
