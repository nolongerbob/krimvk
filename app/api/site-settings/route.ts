import { NextResponse } from 'next/server';
import { readRuntimeSettings } from '@/lib/site-runtime-settings';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(await readRuntimeSettings(), { headers: { 'Cache-Control': 'no-store' } });
}
