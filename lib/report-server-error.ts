/**
 * Операционные алерты: полный текст ошибки + stack в ntfy/Telegram.
 * Без паролей и токенов в теле (санитизация).
 */

import { sendNtfyAlert } from './ntfy-alert';
import { sendTelegramAlert } from './telegram-alert';

export type ServerErrorContext = {
  /** Короткая метка: "GET /api/admin/..." или "uncaughtException" */
  label: string;
  method?: string;
  path?: string;
  status?: number;
  userId?: string;
  /** Доп. строки без ПДн */
  hint?: string;
};

const MAX_LEN = 3900;
const DEFAULT_COOLDOWN_MS = 120_000;

const lastSentAt = new Map<string, number>();

function alertsEnabled(): boolean {
  if (process.env.NTFY_ALERT_ENABLED === '0') {
    return false;
  }
  return Boolean(
    process.env.NTFY_TOPIC ||
      (process.env.TELEGRAM_ALERT_BOT_TOKEN && process.env.TELEGRAM_ALERT_CHAT_ID)
  );
}

function cooldownMs(): number {
  const raw = process.env.NTFY_ALERT_COOLDOWN_MS;
  if (!raw) {
    return DEFAULT_COOLDOWN_MS;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_COOLDOWN_MS;
}

function includeStack(): boolean {
  return process.env.NTFY_ALERT_STACK !== '0';
}

/** Убираем секреты из текста перед отправкой в push. */
export function sanitizeAlertText(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/(password|passwd|secret|api[_-]?key|token)(["']?\s*[:=]\s*["']?)[^\s"']+/gi, '$1$2[redacted]')
    .replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://[redacted]')
    .replace(/AWS_SECRET_ACCESS_KEY=[^\s]+/gi, 'AWS_SECRET_ACCESS_KEY=[redacted]');
}

function fingerprint(ctx: ServerErrorContext, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const stackLine =
    err instanceof Error && err.stack
      ? err.stack.split('\n')[1]?.trim() ?? ''
      : '';
  return [ctx.label, ctx.path, msg, stackLine].filter(Boolean).join('|');
}

function shouldThrottle(key: string): boolean {
  const cd = cooldownMs();
  if (cd === 0) {
    return false;
  }
  const now = Date.now();
  const prev = lastSentAt.get(key);
  if (prev != null && now - prev < cd) {
    return true;
  }
  lastSentAt.set(key, now);
  return false;
}

function formatReport(ctx: ServerErrorContext, err: unknown): string {
  const host = process.env.NEXTAUTH_URL || process.env.HOSTNAME || 'krimvk';
  const lines: string[] = [`[${host}] ${ctx.label}`];

  if (ctx.method && ctx.path) {
    lines.push(`${ctx.method} ${ctx.path}`);
  } else if (ctx.path) {
    lines.push(ctx.path);
  }
  if (ctx.status != null) {
    lines.push(`HTTP ${ctx.status}`);
  }
  if (ctx.userId) {
    lines.push(`userId=${ctx.userId}`);
  }
  if (ctx.hint) {
    lines.push(`hint: ${ctx.hint}`);
  }

  lines.push('');

  if (err instanceof Error) {
    lines.push(err.name ? `${err.name}: ${err.message}` : err.message);
    if (includeStack() && err.stack) {
      lines.push('');
      lines.push(err.stack);
    }
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause != null) {
      lines.push('');
      lines.push('Caused by:');
      lines.push(cause instanceof Error ? cause.stack || cause.message : String(cause));
    }
  } else {
    lines.push(String(err));
  }

  return sanitizeAlertText(lines.join('\n').slice(0, MAX_LEN));
}

/** Отправить алерт (с троттлингом одинаковых ошибок). */
export async function reportServerError(
  ctx: ServerErrorContext,
  err: unknown
): Promise<void> {
  if (!alertsEnabled()) {
    return;
  }

  const key = fingerprint(ctx, err);
  if (shouldThrottle(key)) {
    return;
  }

  const text = formatReport(ctx, err);
  const title = ctx.label.slice(0, 200);
  const priority =
    ctx.label.includes('uncaught') || ctx.label.includes('unhandled')
      ? 'urgent'
      : 'high';

  await Promise.all([
    sendNtfyAlert(text, { title, priority }),
    sendTelegramAlert(text),
  ]);
}

const SKIP_CONSOLE_PATTERNS = [
  /^\s*GET \/api\/health\b/i,
  /ECONNRESET/i,
  /AbortError/i,
];

/** Вызов из перехвата console.error (см. install-ops-alerts.ts). */
export function reportFromConsoleErrorArgs(args: unknown[]): void {
  if (!alertsEnabled() || args.length === 0) {
    return;
  }

  let label = 'console.error';
  let err: unknown = args[0];

  if (typeof args[0] === 'string') {
    label = args[0].slice(0, 200);
    if (args[1] != null) {
      err = args[1];
    } else {
      err = new Error(args[0]);
    }
  }

  if (!(err instanceof Error)) {
    if (typeof err === 'string' && SKIP_CONSOLE_PATTERNS.some((p) => p.test(err as string))) {
      return;
    }
    if (!(err instanceof Error)) {
      err = new Error(String(err));
    }
  }

  if (SKIP_CONSOLE_PATTERNS.some((p) => p.test(label))) {
    return;
  }

  void reportServerError({ label }, err);
}
