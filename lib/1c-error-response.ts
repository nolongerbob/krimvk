import { NextResponse } from 'next/server';

/** Преобразует ошибку 1С в HTTP-ответ (без паролей в теле). */
export function jsonFrom1cError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('ONE_C_API_BASE_URL is not set')) {
    return NextResponse.json(
      {
        error: 'Интеграция с 1С не настроена на сервере (ONE_C_API_BASE_URL).',
        code: '1C_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  if (
    message.includes('AUTH_ERROR') ||
    message.includes('incoming data') ||
    message.includes('401') ||
    message.includes('403')
  ) {
    return NextResponse.json(
      {
        error: 'Неверный номер лицевого счёта или пароль для 1С.',
        code: '1C_AUTH',
      },
      { status: 401 }
    );
  }

  if (
    message.includes('TIMEOUT') ||
    message.includes('CONNECTION_REFUSED') ||
    message.includes('NETWORK_ERROR') ||
    message.includes('fetch failed') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('UND_ERR')
  ) {
    return NextResponse.json(
      {
        error:
          'Сервер 1С недоступен с VPS. Нужен доступ по сети (firewall/VPN) или проверьте ONE_C_API_BASE_URL.',
        code: '1C_UNAVAILABLE',
        hint: 'На VPS: ./scripts/test-1c-connection.sh',
      },
      { status: 503 }
    );
  }

  if (message.includes('1C_BUSINESS_ERROR') || message.includes('1C_EMPTY') || message.includes('1C_PARSE')) {
    return NextResponse.json(
      {
        error: '1С вернула ошибку. Проверьте номер лицевого счёта, пароль и регион (обычно prog).',
        code: '1C_BUSINESS',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 502 }
    );
  }

  if (
    message.includes('Регион обязателен') ||
    message.includes('Invalid1cRegionError') ||
    message.includes('Недопустимый формат региона') ||
    message.includes('не поддерживается')
  ) {
    return NextResponse.json(
      {
        error:
          'Указан недопустимый регион для 1С. Выберите район из списка (prog, saki, evpatoria, chernomor).',
        code: '1C_REGION',
      },
      { status: 400 }
    );
  }

  console.error('[1C API]', message);

  return NextResponse.json(
    {
      error: 'Ошибка при получении данных из 1С.',
      code: '1C_ERROR',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
    },
    { status: 502 }
  );
}
