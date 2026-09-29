import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { getAppSession } from '@/lib/get-app-session';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/security/http-guard';
import { createVkFlow, hashVkState, isVkAuthEnabled, VK_FLOW_COOKIE, VK_SERVICES } from '@/lib/vk-auth';

export async function POST(request: NextRequest) {
  if (!isVkAuthEnabled()) return NextResponse.json({ error: 'Вход доступен только на HTTPS dev' }, { status: 404 });
  if (request.headers.get('origin') !== process.env.NEXTAUTH_URL) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !VK_SERVICES.includes(body.service) || !['login', 'link'].includes(body.mode)) return NextResponse.json({ error: 'Неверные параметры' }, { status: 400 });
  const session = await getAppSession(request);
  const rateKey = session?.user?.id || request.headers.get('x-forwarded-for') || 'anonymous';
  if (!rateLimit(`vk-start:${rateKey}`, 10, 60000)) return NextResponse.json({ error: 'Подождите минуту' }, { status: 429 });
  let userId: string | null = null;
  if (body.mode === 'link') {
    if (!session?.user?.id) return NextResponse.json({ error: 'Сначала войдите в кабинет' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (typeof body.password !== 'string' || body.password.length > 256 || !user?.password || !await verifyPassword(body.password, user.password)) return NextResponse.json({ error: 'Неверный пароль кабинета' }, { status: 403 });
    userId = user.id;
  }
  const flow = createVkFlow(body.service);
  await prisma.verificationToken.create({ data: { identifier: 'vk-oauth', token: hashVkState(flow.state), expires: new Date(Date.now() + 300000) } });
  const signed = await encode({ secret: process.env.NEXTAUTH_SECRET!, maxAge: 300,
    token: { id: 'vk-flow', email: '', purpose: 'vk-oauth', state: flow.state, verifier: flow.verifier, mode: body.mode, userId } });
  const response = NextResponse.json({ url: flow.url }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(VK_FLOW_COOKIE, signed, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 300 });
  return response;
}
