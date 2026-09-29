import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { readRuntimeSettings, parseRuntimeSettings, saveRuntimeSettings } from '@/lib/site-runtime-settings';
export const dynamic = 'force-dynamic';
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await readRuntimeSettings(), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  try { if (!origin || new URL(origin).host !== host) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 }); }
  catch { return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 }); }
  let settings;
  try { settings = parseRuntimeSettings(await request.json()); }
  catch { return NextResponse.json({ error: 'Некорректные настройки' }, { status: 400 }); }
  try { return NextResponse.json(await saveRuntimeSettings(settings)); }
  catch { return NextResponse.json({ error: 'Не настроено постоянное хранилище настроек сайта.' }, { status: 503 }); }
}
