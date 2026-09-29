import type { NextRequest } from 'next/server';
export function expectedAssistantOrigin(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    try { return new URL(process.env.NEXTAUTH_URL || '').origin; } catch { return ''; }
  }
  return `${request.nextUrl.protocol}//${request.headers.get('host') || request.nextUrl.host}`;
}
