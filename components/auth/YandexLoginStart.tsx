'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';

/** Start NextAuth in the new tab so its CSRF/PKCE flow stays intact. */
export function YandexLoginStart() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    setFailed(false);
    try {
      await signIn('yandex', { callbackUrl: '/dashboard' });
    } catch {
      setFailed(true);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, []);

  return <div className="mx-auto max-w-md px-6 py-16 text-center">
    <p role="status" className="text-slate-600">{failed ? 'Не удалось открыть вход через Яндекс.' : 'Переходим к входу через Яндекс…'}</p>
    {failed && <button onClick={() => void start()} className="mt-4 bg-blue-600 px-4 py-2 text-white">Повторить</button>}
  </div>;
}
