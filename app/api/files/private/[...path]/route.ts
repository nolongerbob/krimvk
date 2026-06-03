import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from "@/lib/get-app-session";
import { canAccessPrivateS3Key } from '@/lib/authorize-private-file';
import { isPrivateS3Key } from '@/lib/s3-file-access';
import { serveS3File } from '@/lib/serve-s3-file';

export { dynamic } from '@/lib/force-dynamic-route';
export const runtime = 'nodejs';

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getAppSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const segments = context.params.path || [];
  if (!segments.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const key = segments.map((s) => decodeURIComponent(s)).join('/');
  if (!isPrivateS3Key(key)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allowed = await canAccessPrivateS3Key(
    key,
    session.user.id,
    session.user.role
  );
  if (!allowed) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  return serveS3File(key, { cache: 'private' });
}
