import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { normalizeDadataQuery } from '@/lib/security/dadata';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const query = normalizeDadataQuery(body?.query);
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const apiKey = process.env.DADATA_API_KEY;
    const secretKey = process.env.DADATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'DaData: add DADATA_API_KEY and DADATA_SECRET_KEY to .env'
        );
      }
      return NextResponse.json({ suggestions: [] });
    }

    const response = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${apiKey}`,
          'X-Secret': secretKey,
        },
        body: JSON.stringify({
          query,
          count: 10,
          locations: [{ kladr_id: '9100000000000' }],
        }),
      }
    );

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        const errorText = await response.text();
        console.error('DaData API error:', response.status, errorText);
      }
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    return NextResponse.json({ suggestions: data.suggestions || [] });
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
