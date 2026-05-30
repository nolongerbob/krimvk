/**
 * Оповещения в Telegram (операционные, без ПДн в тексте).
 * TELEGRAM_ALERT_BOT_TOKEN + TELEGRAM_ALERT_CHAT_ID в .env
 */

const MAX_LEN = 4000;

export async function sendTelegramAlert(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_ALERT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) {
    return false;
  }

  const text = message.slice(0, MAX_LEN);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function formatServerError(label: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const host = process.env.NEXTAUTH_URL || process.env.HOSTNAME || 'krimvk';
  return `[${host}] ${label}\n${msg}`;
}
