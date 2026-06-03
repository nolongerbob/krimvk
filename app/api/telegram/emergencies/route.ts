import { NextRequest, NextResponse } from "next/server";

interface ParsedMessage {
  id: number;
  text: string;
  date: Date;
  hasPhoto: boolean;
  photoUrl?: string;
}

const CACHE_TTL_MS = 2 * 60 * 1000;
let cache: { channel: string; messages: ParsedMessage[]; fetchedAt: number } | null =
  null;

export async function GET(request: NextRequest) {
  try {
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME || "krimVK";
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const debug =
      process.env.NODE_ENV === "development" &&
      searchParams.get("debug") === "true";

    const now = Date.now();
    let messages: ParsedMessage[];
    if (
      cache &&
      cache.channel === channelUsername &&
      now - cache.fetchedAt < CACHE_TTL_MS
    ) {
      messages = cache.messages;
    } else {
      messages = await fetchPublicChannelMessages(channelUsername);
      cache = { channel: channelUsername, messages, fetchedAt: now };
    }

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
        allMessages: messages.map((m) => ({
          id: m.id,
          date: m.date.toISOString(),
          textPreview: m.text.substring(0, 100),
        })),
        serverTime: new Date().toISOString(),
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

async function fetchPublicChannelMessages(
  channelUsername: string
): Promise<ParsedMessage[]> {
  const messages: ParsedMessage[] = [];

  try {
    const response = await fetch(`https://t.me/s/${channelUsername}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch channel:", response.status);
      return messages;
    }

    const html = await response.text();
    const blocks = html.split(/(?=<div[^>]*data-post=")/);

    for (const block of blocks) {
      const postIdMatch = block.match(/data-post="([^"]+)"/);
      if (!postIdMatch) continue;

      const postId = postIdMatch[1];
      const messageId = parseInt(postId.split("/").pop() || "0");
      if (!messageId) continue;

      const textMatch = block.match(
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/
      );
      if (!textMatch) continue;

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

      const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"/);
      const datetime = timeMatch ? timeMatch[1] : null;

      let date: Date;
      if (datetime) {
        date = new Date(datetime);
      } else {
        const timeTextMatch = block.match(/>(\d{1,2}:\d{2})</);
        if (timeTextMatch) {
          const today = new Date();
          const [hours, minutes] = timeTextMatch[1].split(":").map(Number);
          date = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            hours,
            minutes
          );
        } else {
          date = new Date();
        }
      }

      const hasPhoto =
        block.includes("tgme_widget_message_photo") ||
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

    const uniqueMessages = messages.filter(
      (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
    );

    uniqueMessages.sort((a, b) => b.date.getTime() - a.date.getTime());

    return uniqueMessages;
  } catch (error) {
    console.error("Error parsing channel:", error);
    return messages;
  }
}

function filterTodayMessages(messages: ParsedMessage[]) {
  const now = new Date();
  const moscowOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const moscowTime = new Date(
    now.getTime() + (moscowOffset + localOffset) * 60 * 1000
  );

  const todayStart = new Date(moscowTime);
  todayStart.setHours(0, 0, 0, 0);

  return messages.filter((msg) => {
    const msgDate = new Date(msg.date);
    const msgMoscowTime = new Date(
      msgDate.getTime() + (moscowOffset + msgDate.getTimezoneOffset()) * 60 * 1000
    );
    const msgDateStart = new Date(msgMoscowTime);
    msgDateStart.setHours(0, 0, 0, 0);
    return msgDateStart.getTime() === todayStart.getTime();
  });
}
