import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export const maxDuration = 30;

/**
 * API endpoint для анализа изображения счетчика с помощью ИИ
 * Использует OCR для распознавания показаний
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "Изображение не найдено" }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: 400 }
      );
    }

    // Проверяем размер файла (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 10MB" },
        { status: 400 }
      );
    }

    // Конвертируем файл в base64 для отправки в API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Используем Google Vision API для OCR
    // В продакшене нужно добавить GOOGLE_VISION_API_KEY в .env
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    let recognizedValue: number | null = null;
    let confidence: number = 0;

    if (apiKey) {
      // Используем Google Vision API
      try {
        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requests: [
                {
                  image: {
                    content: base64Image,
                  },
                  features: [
                    {
                      type: "TEXT_DETECTION",
                      maxResults: 10,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const textAnnotations = visionData.responses?.[0]?.textAnnotations;

          if (textAnnotations && textAnnotations.length > 0) {
            // Извлекаем числа из распознанного текста
            const fullText = textAnnotations[0].description || "";
            const numbers = extractMeterReading(fullText);
            
            if (numbers.length > 0) {
              // Берем самое большое число (вероятно, это показание счетчика)
              recognizedValue = Math.max(...numbers);
              confidence = 0.8; // Базовая уверенность для Google Vision
            }
          }
        }
      } catch (error) {
        console.error("Google Vision API error:", error);
        // Продолжаем с fallback методом
      }
    }

    // Fallback: используем Tesseract.js через API или локальную обработку
    if (!recognizedValue) {
      // Для демо-версии возвращаем null, чтобы пользователь мог ввести вручную
      // В продакшене можно добавить Tesseract.js или другой OCR сервис
      return NextResponse.json({
        success: true,
        recognizedValue: null,
        confidence: 0,
        message: "Не удалось автоматически распознать показания. Пожалуйста, введите значение вручную.",
      });
    }

    return NextResponse.json({
      success: true,
      recognizedValue,
      confidence,
      message: `Распознано значение: ${recognizedValue.toLocaleString("ru-RU")} м³`,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Ошибка при анализе изображения" },
      { status: 500 }
    );
  }
}

/**
 * Извлекает показания счетчика из текста
 * Ищет числа, которые могут быть показаниями счетчика
 */
function extractMeterReading(text: string): number[] {
  // Удаляем все символы кроме цифр, точек и запятых
  const cleaned = text.replace(/[^\d.,]/g, " ");
  
  // Ищем числа (включая десятичные)
  const numberPattern = /\d+[.,]?\d*/g;
  const matches = cleaned.match(numberPattern);
  
  if (!matches) return [];
  
  // Конвертируем в числа и фильтруем разумные значения для счетчика воды
  const numbers = matches
    .map((match) => {
      // Заменяем запятую на точку для парсинга
      const num = parseFloat(match.replace(",", "."));
      return num;
    })
    .filter((num) => {
      // Показания счетчика обычно от 0 до 999999 (6 цифр)
      return !isNaN(num) && num >= 0 && num < 1000000;
    });
  
  return numbers;
}






