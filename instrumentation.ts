/**
 * Серверные алерты (ntfy / Telegram): краши, API console.error, 5xx.
 * Клиентский UI — Sentry (docs/MOBILE_MONITORING.md).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { applyCanonicalSiteUrl } = await import('./lib/site-url');
  applyCanonicalSiteUrl();

  const hasTelegram =
    process.env.TELEGRAM_ALERT_BOT_TOKEN && process.env.TELEGRAM_ALERT_CHAT_ID;
  const hasNtfy = Boolean(process.env.NTFY_TOPIC);

  if (!hasTelegram && !hasNtfy) {
    return;
  }

  const { installOpsAlerts } = await import('./lib/install-ops-alerts');
  installOpsAlerts();
}
