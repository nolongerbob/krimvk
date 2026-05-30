/**
 * Push на телефон через ntfy (работает в РФ без Telegram).
 * https://ntfy.sh — приложение iOS/Android, подписка на topic.
 *
 * NTFY_TOPIC=случайная-длинная-строка
 * NTFY_SERVER=https://ntfy.sh  (опционально, свой сервер)
 */

const MAX_LEN = 4000;

export async function sendNtfyAlert(
  message: string,
  options?: { title?: string; priority?: 'min' | 'low' | 'default' | 'high' | 'urgent' }
): Promise<boolean> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    return false;
  }

  const base = (process.env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, '');
  const url = `${base}/${encodeURIComponent(topic)}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
    };
    if (options?.title) {
      headers.Title = options.title.slice(0, 200);
    }
    if (options?.priority) {
      headers.Priority = options.priority;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: message.slice(0, MAX_LEN),
    });
    return res.ok;
  } catch {
    return false;
  }
}
