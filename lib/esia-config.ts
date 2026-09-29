type Environment = Record<string, string | undefined>;
export const ESIA_CALLBACK_PATH = '/api/auth/callback/esia';

/** No arbitrary issuer URLs: the preparation is isolated to the ESIA test realm. */
export function getEsiaPreparation(env: Environment = process.env) {
  const development = env.NODE_ENV === 'development';
  const testRealm = env.ESIA_ENVIRONMENT === 'test';
  const clientId = env.ESIA_CLIENT_ID?.trim() || '';
  let callback = '';
  let callbackValid = false;
  try {
    const origin = new URL(env.NEXTAUTH_URL || '');
    const url = new URL(env.ESIA_REDIRECT_URI || '');
    callbackValid = url.protocol === 'https:' && origin.protocol === 'https:'
      && url.origin === origin.origin && url.pathname === ESIA_CALLBACK_PATH
      && !url.username && !url.password && !url.search && !url.hash;
    if (callbackValid) callback = url.href;
  } catch { /* Missing configuration is an expected preparation state. */ }
  const checks = [
    { id: 'development', label: 'Изолированная dev-среда', ready: development },
    { id: 'realm', label: 'Тестовый контур ЕСИА', ready: testRealm },
    { id: 'client', label: 'Мнемоника зарегистрированной системы', ready: !!clientId },
    { id: 'callback', label: 'HTTPS-адрес возврата совпадает с адресом дева', ready: callbackValid },
    { id: 'secret', label: 'Секрет шифрования временного состояния', ready: (env.NEXTAUTH_SECRET?.length || 0) >= 32 },
    { id: 'certificate', label: 'Задан идентификатор сертификата системы', ready: !!env.ESIA_CERTIFICATE_THUMBPRINT?.trim() },
    { id: 'crypto', label: 'Криптопровайдер подписи и проверки токенов подключён и проверен', ready: false },
    { id: 'acceptance', label: 'Пройден настоящий вход в тестовом контуре', ready: false },
  ];
  return { enabled: false as const, checks, callback, configurationReady: checks.slice(0, 6).every(check => check.ready) };
}
