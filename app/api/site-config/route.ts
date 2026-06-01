import { NextResponse } from 'next/server';
import { getSiteBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/** Публичный канонический URL (выход, ссылки на клиенте). */
export async function GET() {
  const siteUrl = getSiteBaseUrl();
  return NextResponse.json({
    siteUrl,
    signOutCallbackUrl: `${siteUrl}/`,
  });
}
