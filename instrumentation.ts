/**
 * Серверные алерты при необработанных ошибках Node (VPS / PM2).
 * Клиентские ошибки — настройте Sentry (см. docs/MOBILE_MONITORING.md).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const hasTelegram =
    process.env.TELEGRAM_ALERT_BOT_TOKEN && process.env.TELEGRAM_ALERT_CHAT_ID;
  const hasNtfy = Boolean(process.env.NTFY_TOPIC);

  if (!hasTelegram && !hasNtfy) {
    return;
  }

  const { formatServerError } = await import('./lib/telegram-alert');
  const { sendTelegramAlert } = hasTelegram
    ? await import('./lib/telegram-alert')
    : { sendTelegramAlert: async () => false };
  const { sendNtfyAlert } = hasNtfy
    ? await import('./lib/ntfy-alert')
    : { sendNtfyAlert: async () => false };

  const notify = (label: string, err: unknown) => {
    const text = formatServerError(label, err);
    void sendTelegramAlert(text);
    void sendNtfyAlert(text, { title: label, priority: 'high' });
  };

  process.on('uncaughtException', (err) => {
    notify('uncaughtException', err);
  });

  process.on('unhandledRejection', (reason) => {
    notify('unhandledRejection', reason);
  });
}
