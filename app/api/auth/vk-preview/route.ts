import { NextResponse } from 'next/server';
import { isVkAuthEnabled, VK_SERVICES } from '@/lib/vk-auth';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const provider = new URL(request.url).searchParams.get('provider') ?? 'vkid';
  if (!isVkAuthEnabled() || !(VK_SERVICES as readonly string[]).includes(provider)) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  const url = `https://dev.krimvk.ru/login/vk?service=${provider}`;
  return new NextResponse(null, { status: 303, headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
