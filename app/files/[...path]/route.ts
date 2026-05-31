import { NextRequest, NextResponse } from 'next/server';
import { servePublicS3File } from '@/lib/serve-public-s3-file';

export { dynamic } from '@/lib/force-dynamic-route';
export const runtime = 'nodejs';

type RouteContext = { params: { path: string[] } };

export async function GET(_request: NextRequest, context: RouteContext) {
  const segments = context.params.path || [];
  if (!segments.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const key = segments.map((s) => decodeURIComponent(s)).join('/');
  return servePublicS3File(key);
}
