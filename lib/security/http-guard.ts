import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Простой in-memory rate limit (один PM2-процесс на VPS). */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

const SCANNER_PATHS =
  /^\/(\.env|\.git|wp-admin|wp-login\.php|wp-content|phpmyadmin|pma|admin\.php|xmlrpc\.php|vendor\/phpunit|actuator|\.well-known\/security\.txt)/i;

export function blockScannerPaths(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;
  if (SCANNER_PATHS.test(path) || path.includes('..')) {
    return new NextResponse(null, { status: 404 });
  }
  return null;
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Лимиты на чувствительные API (дополнение к nginx). */
export function applyRateLimit(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;

  if (path === '/api/health') {
    return null;
  }

  const ip = clientIp(req);
  const keyBase = `${ip}:${path.split('/').slice(0, 4).join('/')}`;

  const verifyEmailPaths =
    path === '/api/auth/verify-email' ||
    path === '/api/auth/check-email-verified' ||
    path === '/api/auth/resend-verification';

  if (verifyEmailPaths) {
    if (!rateLimit(`verify-email:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  const strictAuth =
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/register') ||
    path.startsWith('/api/auth/forgot-password') ||
    path.startsWith('/api/auth/reset-password') ||
    path === '/api/auth/auto-login' ||
    path === '/api/auth/mobile-login';

  if (strictAuth) {
    if (!rateLimit(`strict:${keyBase}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите минуту.' }, { status: 429 });
    }
    return null;
  }

  if (path.startsWith('/api/auth/')) {
    if (!rateLimit(`auth:${keyBase}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path.startsWith('/api/admin/')) {
    if (!rateLimit(`admin:${ip}`, 120, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path.startsWith('/api/files/private/')) {
    if (!rateLimit(`files:${ip}`, 80, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path === '/api/address/suggest') {
    if (!rateLimit(`dadata:${ip}`, 40, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path === '/api/telegram/emergencies') {
    if (!rateLimit(`telegram:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path === '/api/emergency') {
    if (!rateLimit(`emergency:${ip}`, 5, 15 * 60_000)) {
      return NextResponse.json(
        { error: 'Слишком много обращений. Попробуйте позже.' },
        { status: 429 }
      );
    }
    return null;
  }

  if (path === '/api/search') {
    if (!rateLimit(`search:${ip}`, 40, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path === '/api/questions/create') {
    if (!rateLimit(`questions:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Слишком много сообщений.' }, { status: 429 });
    }
    return null;
  }

  if (path === '/api/meters/analyze-image') {
    if (!rateLimit(`meter-ai:${ip}`, 20, 60 * 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path === '/api/applications/fill-pdf') {
    if (!rateLimit(`fill-pdf:${ip}`, 15, 60 * 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
    return null;
  }

  if (path.startsWith('/api/')) {
    if (!rateLimit(`api:${ip}`, 200, 60_000)) {
      return NextResponse.json({ error: 'Слишком много запросов.' }, { status: 429 });
    }
  }

  return null;
}
