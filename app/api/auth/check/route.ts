import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Логируем для отладки
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/check] Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
      });
    }
    
    return NextResponse.json({ 
      authenticated: !!session, 
      user: session?.user || null 
    }, { status: 200 });
  } catch (error) {
    console.error('[auth/check] Error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      user: null,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 200 });
  }
}


