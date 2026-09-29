import { NextResponse } from 'next/server';

/** Fail closed until a certified signing/verification adapter is integrated. */
export async function POST() {
  return NextResponse.json({ code: 'ESIA_NOT_READY', error: 'Вход через Госуслуги ещё не подключён. Используйте другой способ входа.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
