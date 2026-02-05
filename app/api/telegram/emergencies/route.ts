import { NextRequest, NextResponse } from "next/server";

interface ParsedMessage {
  id: number;
  text: string;
  date: Date;
  hasPhoto: boolean;
  photoUrl?: string;
}

// Получение сообщений из Telegram канала
export async function GET(request: NextRequest) {
  try {
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME || "krimVK";
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get("debug") === "true";
    const all = searchParams.get("all") === "true"; // Показать все сообщения без фильтрации

    // Парсим публичную веб-версию канала
    const messages = await fetchPublicChannelMessages(channelUsername);
    
    // Фильтруем только сегодняшние сообщения (если не запрошены все)
    const todayMessages = all ? messages : filterTodayMessages(messages);

    const response: {
      messages: ParsedMessage[];
      totalParsed?: number;
      debug?: {
        allMessages: Array<{ id: number; date: string; textPreview: string }>;
        serverTime: string;
      };
    } = {
      messages: todayMessages,
      totalParsed: messages.length,
    };
    
    if (debug) {
      response.debug = {
        allMessages: messages.map(m => ({
          id: m.id,
          date: m.date.toISOString(),
          textPreview: m.text.substring(0, 100)
        })),
        serverTime: new Date().toISOString()
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching Telegram messages:", error);
    return NextResponse.json(
      { error: "Ошибка при получении сообщений", messages: [] },
      { status: 500 }
    );
  }
}

// Парсинг публичной веб-версии канала
async function fetchPublicChannelMessages(channelUsername: string): Promise<ParsedMessage[]> {
  const messages: ParsedMessage[] = [];

  try {
    // Запрашиваем веб-версию канала
    const response = await fetch(`https://t.me/s/${channelUsername}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch channel:", response.status);
      return messages;
    }

    const html = await response.text();

    // Парсим каждое сообщение отдельно
    // Ищем все блоки с data-post
    const messageBlockRegex = /data-post="([^"]+)"[\s\S]*?(?=data-post="|$)/g;
    const blocks = html.split(/(?=<div[^>]*data-post=")/);
    
    for (const block of blocks) {
      // Извлекаем ID поста
      const postIdMatch = block.match(/data-post="([^"]+)"/);
      if (!postIdMatch) continue;
      
      const postId = postIdMatch[1];
      const messageId = parseInt(postId.split("/").pop() || "0");
      if (!messageId) continue;
      
      // Извлекаем текст сообщения
      const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (!textMatch) continue;
      
      // Очищаем HTML от тегов
      let text = textMatch[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
        .trim();
      
      if (!text) continue;
      
      // Извлекаем дату
      const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"/);
      const datetime = timeMatch ? timeMatch[1] : null;
      
      // Если нет точной даты, пробуем извлечь из ссылки на время
      let date: Date;
      if (datetime) {
        date = new Date(datetime);
      } else {
        // Пробуем найти время в формате HH:MM
        const timeTextMatch = block.match(/>(\d{1,2}:\d{2})</);
        if (timeTextMatch) {
          const today = new Date();
          const [hours, minutes] = timeTextMatch[1].split(":").map(Number);
          date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        } else {
          date = new Date();
        }
      }
      
      // Проверяем наличие фото
      const hasPhoto = block.includes("tgme_widget_message_photo") || 
                       block.includes("background-image:url");
      
      let photoUrl: string | undefined;
      if (hasPhoto) {
        const photoMatch = block.match(/background-image:url\('([^']+)'\)/);
        if (photoMatch) {
          photoUrl = photoMatch[1];
        }
      }
      
      messages.push({
        id: messageId,
        text,
        date,
        hasPhoto,
        photoUrl,
      });
    }

    // Убираем дубликаты по ID
    const uniqueMessages = messages.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );

    // Сортируем по дате (новые первые)
    uniqueMessages.sort((a, b) => b.date.getTime() - a.date.getTime());

    console.log(`Parsed ${uniqueMessages.length} messages from channel @${channelUsername}`);
    
    return uniqueMessages;
  } catch (error) {
    console.error("Error parsing channel:", error);
    return messages;
  }
}

// Фильтрация только сегодняшних сообщений
function filterTodayMessages(messages: ParsedMessage[]) {
  // Используем московское время (UTC+3) как основное для Крыма
  const now = new Date();
  const moscowOffset = 3 * 60; // UTC+3 в минутах
  const localOffset = now.getTimezoneOffset();
  const moscowTime = new Date(now.getTime() + (moscowOffset + localOffset) * 60 * 1000);
  
  const todayStart = new Date(moscowTime);
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(moscowTime);
  todayEnd.setHours(23, 59, 59, 999);
  
  console.log(`Filtering messages for today: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
  
  return messages.filter((msg) => {
    const msgDate = new Date(msg.date);
    // Приводим к московскому времени для сравнения
    const msgMoscowTime = new Date(msgDate.getTime() + (moscowOffset + msgDate.getTimezoneOffset()) * 60 * 1000);
    
    const msgDateStart = new Date(msgMoscowTime);
    msgDateStart.setHours(0, 0, 0, 0);
    
    const isToday = msgDateStart.getTime() === todayStart.getTime();
    
    if (isToday) {
      console.log(`Message ${msg.id} from ${msgDate.toISOString()} is from today`);
    }
    
    return isToday;
  });
}

// Очистка старых сообщений (можно вызывать по cron)
export async function DELETE(request: NextRequest) {
  try {
    // Очищаем кэш
    cachedMessages = [];
    lastFetch = 0;
    
    return NextResponse.json({ success: true, message: "Кэш очищен" });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при очистке кэша" },
      { status: 500 }
    );
  }
}
