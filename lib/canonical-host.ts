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
  if (!hostname) {
    return null;
  }

  const canonical =
    process.env.CANONICAL_HOST ||
    process.env.SITE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
    'krimvk.ru';

  const canonicalHost =
    canonical.replace(/^https?:\/\//, '').split('/')[0]?.toLowerCase() || 'krimvk.ru';

  if (hostname === canonicalHost) {
    return null;
  }

  const canonicalIsWww = canonicalHost.startsWith('www.');
  const apexHost = canonicalIsWww ? canonicalHost.slice(4) : canonicalHost;
  const wwwHost = canonicalIsWww ? canonicalHost : `www.${canonicalHost}`;

  if (!canonicalIsWww && hostname === wwwHost) {
    const target = req.nextUrl.clone();
    target.protocol = 'https:';
    target.host = apexHost;
    return NextResponse.redirect(target, 308);
  }

  if (canonicalIsWww && hostname === apexHost) {
    const target = req.nextUrl.clone();
    target.protocol = 'https:';
    target.host = canonicalHost;
    return NextResponse.redirect(target, 308);
  }

  if (!IP_HOST.test(hostname)) {
    return null;
  }

  const target = req.nextUrl.clone();
  target.protocol = 'https:';
  target.host = canonicalHost;
  return NextResponse.redirect(target, 308);
}
