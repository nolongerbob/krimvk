/** Explicit development opt-in; credentials alone must never enable production login. */
export function isYandexAuthEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV === 'development' && env.YANDEX_AUTH_ENABLED === 'true'
    && !!env.YANDEX_CLIENT_ID?.trim() && !!env.YANDEX_CLIENT_SECRET?.trim();
}
