import { NextResponse } from 'next/server';
import { ESIA_FLOW_COOKIE, esiaFlowCookieOptions } from '@/lib/esia-flow';

/** A callback URL alone must never grant access or link an identity. */
export async function GET() {
  const response = NextResponse.json({ code: 'ESIA_NOT_READY', error: 'Интеграция Госуслуг готовится. Вернитесь на страницу входа и выберите другой способ.' },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  response.cookies.set(ESIA_FLOW_COOKIE, '', { ...esiaFlowCookieOptions, maxAge: 0 });
  return response;
}
