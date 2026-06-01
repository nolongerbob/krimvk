import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthJwtFromRequest } from '@/lib/auth-middleware-token';
import { canonicalHostRedirect } from '@/lib/canonical-host';
import { getRedirectBaseUrl } from '@/lib/site-url';
import { isMaintenanceBypass, isMaintenanceMode } from '@/lib/maintenance';
import { applyRateLimit, blockScannerPaths } from '@/lib/security/http-guard';

export async function middleware(req: NextRequest) {
  const hostRedirect = canonicalHostRedirect(req);
  if (hostRedirect) {
    return hostRedirect;
  }

  const { pathname } = req.nextUrl;

  if (isMaintenanceMode() && !isMaintenanceBypass(pathname)) {
    const maintenance = req.nextUrl.clone();
    maintenance.pathname = '/maintenance.html';
    maintenance.search = '';
    return NextResponse.redirect(maintenance, 307);
  }

  const scanBlock = blockScannerPaths(req);
  if (scanBlock) {
    return scanBlock;
  }

  const rateLimited = applyRateLimit(req);
  if (rateLimited) {
    return rateLimited;
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const token = await getAuthJwtFromRequest(req);
    if (!token) {
      const login = new URL('/login', getRedirectBaseUrl());
      login.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|maintenance\\.html|images/).*)',
  ],
};
