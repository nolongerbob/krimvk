import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const IP_HOST = /^(\d{1,3}\.){3}\d{1,3}$/;

export function canonicalHostRedirect(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  if (process.env.DISABLE_CANONICAL_HOST_REDIRECT === '1') {
    return null;
  }

  const hostHeader = req.headers.get('host') || '';
  const hostname = hostHeader.split(':')[0]?.toLowerCase() || '';
  const canonical =
    process.env.CANONICAL_HOST ||
    process.env.SITE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
    'krimvk.ru';

  const canonicalHost = canonical.replace(/^https?:\/\//, '').split('/')[0] || 'krimvk.ru';

  if (!hostname || hostname === canonicalHost || hostname === `www.${canonicalHost}`) {
    return null;
  }

  if (!IP_HOST.test(hostname)) {
    return null;
  }

  const target = req.nextUrl.clone();
  target.protocol = 'https:';
  target.host = canonicalHost;
  return NextResponse.redirect(target, 308);
}
