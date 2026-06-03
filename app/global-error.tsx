'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Критическая ошибка</h1>
          <p>Попробуйте обновить страницу.</p>
          <button type="button" onClick={() => reset()}>
            Повторить
          </button>
        </div>
      </body>
    </html>
  );
}
