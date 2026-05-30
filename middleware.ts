import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applyRateLimit, blockScannerPaths } from '@/lib/security/http-guard';

export async function middleware(req: NextRequest) {
  const scanBlock = blockScannerPaths(req);
  if (scanBlock) {
    return scanBlock;
  }

  const rateLimited = applyRateLimit(req);
  if (rateLimited) {
    return rateLimited;
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const login = new URL('/login', req.url);
      login.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/:path*'],
};
