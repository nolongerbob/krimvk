import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    // Используем DaData API для автодополнения адресов
    // Для работы нужен API ключ DaData (бесплатный тариф до 10,000 запросов/день)
    const DADATA_API_KEY = process.env.DADATA_API_KEY;
    const DADATA_SECRET_KEY = process.env.DADATA_SECRET_KEY;

    if (!DADATA_API_KEY || !DADATA_SECRET_KEY) {
      // Если нет API ключа, возвращаем пустой массив
      // В продакшене нужно добавить ключи в .env
      console.warn("DaData API keys not configured. Add DADATA_API_KEY and DADATA_SECRET_KEY to .env");
      return NextResponse.json({ suggestions: [] });
    }

    console.log("Making request to DaData API for query:", query);

    const response = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${DADATA_API_KEY}`,
        "X-Secret": DADATA_SECRET_KEY,
      },
      body: JSON.stringify({
        query: query,
        count: 10,
        locations: [
          {
            kladr_id: "9100000000000", // Республика Крым
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DaData API error:", response.status, errorText);
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    console.log("DaData API response:", JSON.stringify(data).substring(0, 200));
    return NextResponse.json({ suggestions: data.suggestions || [] });
  } catch (error) {
    console.error("Error fetching address suggestions:", error);
    return NextResponse.json({ suggestions: [] });
  }
}

