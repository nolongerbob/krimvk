import { NextResponse } from 'next/server';
import { isEsiaPreviewEnabled } from '@/lib/esia-preparation';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ preview: isEsiaPreviewEnabled() }, { headers: { 'Cache-Control': 'no-store' } });
}
